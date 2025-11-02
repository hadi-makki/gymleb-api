import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GymEntity } from 'src/gym/entities/gym.entity';
import { ManagerEntity } from 'src/manager/manager.entity';
import { BadRequestException } from '../error/bad-request-error';
import { Permissions } from 'src/decorators/roles/role.enum';
import { GymService } from 'src/gym/gym.service';

export interface GymSeedData {
  id: string; // Gym ID - source of truth
  name: string;
  address: string;
  phone: string;
}

export interface OwnerSeedData {
  id: string; // Owner ID - source of truth
  username: string;
  email?: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  password?: string; // Optional - if not provided, generates default
}

interface LicensePayload {
  gym: GymSeedData; // Gym data including ID (source of truth)
  owner: OwnerSeedData; // Owner data including ID (source of truth)
  issuedAt: number; // Unix timestamp
  expiresAt: number; // Unix timestamp
  type: 'desktop-license';
}

interface LicenseValidationResult {
  valid: boolean;
  expiresAt: Date | null;
  error?: string;
  gym?: GymSeedData;
  owner?: OwnerSeedData;
}

@Injectable()
export class LicenseService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(GymEntity)
    private readonly gymRepository: Repository<GymEntity>,
    @InjectRepository(ManagerEntity)
    private readonly managerRepository: Repository<ManagerEntity>,
    private readonly gymService: GymService,
  ) {}

  /**
   * Helper method to normalize key format
   * Converts \n escape sequences to actual newlines
   * Handles both formats: single-line with \n and multi-line
   */
  private normalizeKey(key: string): string {
    if (!key) {
      return key;
    }
    // If key contains literal \n (not actual newlines), convert them
    // This happens when keys are stored in .env as single-line strings
    if (key.includes('\\n') && !key.includes('\n')) {
      return key.replace(/\\n/g, '\n');
    }
    // Key already has newlines or is already properly formatted
    return key;
  }

  /**
   * Gets and normalizes the private key from environment
   */
  private getPrivateKey(): string {
    const key = this.configService.get<string>('LICENSE_PRIVATE_KEY');
    if (!key) {
      throw new Error('LICENSE_PRIVATE_KEY not configured');
    }
    return this.normalizeKey(key);
  }

  /**
   * Gets and normalizes the public key from environment
   */
  private getPublicKey(): string {
    const key = this.configService.get<string>('LICENSE_PUBLIC_KEY');
    if (!key) {
      throw new Error('LICENSE_PUBLIC_KEY not configured');
    }
    return this.normalizeKey(key);
  }

  /**
   * Validates a license key without saving it to the database
   * Checks signature, expiration, and clock manipulation
   * Uses RS256 (asymmetric) verification with public key
   */
  async validateLicenseKey(
    licenseKey: string,
    gymId?: string, // Optional - if provided, validates it matches token
    licenseKeyActivatedAt?: Date,
  ): Promise<LicenseValidationResult> {
    try {
      // Get the public key for verification (safe to bundle in app)
      const publicKey = this.getPublicKey();

      let payload: LicensePayload;
      try {
        // Verify with RS256 algorithm using public key
        payload = this.jwtService.verify<LicensePayload>(licenseKey, {
          publicKey,
          algorithms: ['RS256'], // Only accept RS256 signed tokens
        });
      } catch (error) {
        if (error.name === 'TokenExpiredError') {
          return {
            valid: false,
            expiresAt: null,
            error: 'License key has expired',
          };
        }
        if (error.name === 'JsonWebTokenError') {
          return {
            valid: false,
            expiresAt: null,
            error: 'Invalid license key signature or format',
          };
        }
        return {
          valid: false,
          expiresAt: null,
          error: 'Invalid license key format or signature',
        };
      }

      console.log('this is the payload', payload);

      // Verify license type
      if (payload.type !== 'desktop-license') {
        return {
          valid: false,
          expiresAt: null,
          error: 'Invalid license key type',
        };
      }

      // Verify gym and owner data exist
      if (!payload.gym || !payload.owner) {
        return {
          valid: false,
          expiresAt: null,
          error: 'License key missing gym or owner data',
        };
      }

      // Use gym ID from token (source of truth)
      const tokenGymId = payload.gym.id;

      // If gymId parameter is provided, validate it matches the token
      if (gymId && gymId !== tokenGymId) {
        return {
          valid: false,
          expiresAt: null,
          error: 'License key not valid for this gym',
        };
      }

      // Check if license is expired based on embedded timestamp
      const now = Date.now();
      const expiresAt = new Date(payload.expiresAt * 1000);

      if (payload.expiresAt * 1000 < now) {
        return {
          valid: false,
          expiresAt,
          error: `License key expired on ${expiresAt.toLocaleDateString()}`,
        };
      }

      // Clock manipulation detection
      // If license was previously activated, check that current time hasn't gone backwards
      if (licenseKeyActivatedAt) {
        const activatedTime = licenseKeyActivatedAt.getTime();

        // If current time is significantly before activation time, clock was manipulated
        // Allow 5 minutes of tolerance for clock drift
        const tolerance = 5 * 60 * 1000; // 5 minutes in milliseconds
        if (now < activatedTime - tolerance) {
          return {
            valid: false,
            expiresAt: null,
            error:
              'System time inconsistency detected. Please check your system clock.',
          };
        }
      }

      // Verify that issuedAt is not in the future (another clock manipulation check)
      if (payload.issuedAt * 1000 > now + 60000) {
        // Allow 1 minute tolerance
        return {
          valid: false,
          expiresAt: null,
          error: 'Invalid license key issuance time',
        };
      }

      return {
        valid: true,
        expiresAt,
        gym: payload.gym,
        owner: payload.owner,
      };
    } catch (error) {
      return {
        valid: false,
        expiresAt: null,
        error:
          error.message || 'An error occurred while validating the license',
      };
    }
  }

  /**
   * Extracts license data from a license key without full validation
   * Used for displaying license info
   * Uses RS256 (asymmetric) verification with public key
   */
  extractLicenseData(licenseKey: string): {
    gymId: string; // For backward compatibility
    ownerId: string; // For backward compatibility
    gym: GymSeedData;
    owner: OwnerSeedData;
    issuedAt: Date;
    expiresAt: Date;
  } | null {
    try {
      const publicKey = this.getPublicKey();

      const payload = this.jwtService.verify<LicensePayload>(licenseKey, {
        publicKey,
        algorithms: ['RS256'],
      });

      console.log('this is the payload', payload);

      return {
        gymId: payload.gym.id, // Extract from gym object
        ownerId: payload.owner.id, // Extract from owner object
        gym: payload.gym,
        owner: payload.owner,
        issuedAt: new Date(payload.issuedAt * 1000),
        expiresAt: new Date(payload.expiresAt * 1000),
      };
    } catch {
      return null;
    }
  }

  /**
   * Validates and activates a license key for a gym
   * Creates/seeds gym and owner if they don't exist
   * Saves license to the database if valid
   */
  async activateLicenseKey(
    licenseKey: string,
    gymId?: string, // Optional - uses gymId from token if not provided
  ): Promise<GymEntity> {
    // Extract license data first to get seed data
    const licenseData = this.extractLicenseData(licenseKey);
    if (!licenseData || !licenseData.gym || !licenseData.owner) {
      throw new BadRequestException(
        'Failed to extract license data or missing gym/owner data',
      );
    }

    // Use gym ID from token (source of truth)
    const tokenGymId = licenseData.gym.id;

    // If gymId parameter is provided, validate it matches the token
    if (gymId && gymId !== tokenGymId) {
      throw new BadRequestException(
        'Gym ID in request does not match the gym ID in license key',
      );
    }

    // Find or create the gym using ID from token
    let gym = await this.gymRepository.findOne({
      where: { id: tokenGymId },
      relations: ['owner'],
    });

    // Find or create the owner using ID from token
    const tokenOwnerId = licenseData.owner.id;
    let owner: ManagerEntity | null = null;

    // Try to find owner by ID first (from token - source of truth)
    owner = await this.managerRepository.findOne({
      where: { id: tokenOwnerId },
    });

    // If not found by ID, try username or email as fallback
    if (!owner && licenseData.owner.username) {
      owner = await this.managerRepository.findOne({
        where: { username: licenseData.owner.username },
      });
    }

    if (!owner && licenseData.owner.email) {
      owner = await this.managerRepository.findOne({
        where: { email: licenseData.owner.email },
      });
    }

    // Create owner if doesn't exist
    if (!owner) {
      // Generate default password if not provided
      const defaultPassword = licenseData.owner.password || 'Password1$';
      const hashedPassword = await ManagerEntity.hashPassword(defaultPassword);

      owner = this.managerRepository.create({
        id: tokenOwnerId, // Use ID from token
        username: licenseData.owner.username,
        email: licenseData.owner.email,
        firstName: licenseData.owner.firstName || 'Owner',
        lastName: licenseData.owner.lastName || 'User',
        phoneNumber: licenseData.owner.phoneNumber,
        password: hashedPassword,
        permissions: [Permissions.GymOwner],
      });

      await this.managerRepository.save(owner);
    } else {
      // Ensure owner has GymOwner permission
      if (!owner.permissions?.includes(Permissions.GymOwner)) {
        owner.permissions = [
          ...(owner.permissions || []),
          Permissions.GymOwner,
        ];
        await this.managerRepository.save(owner);
      }
    }

    if (!gym) {
      // Gym doesn't exist - seed it from license data
      if (!licenseData.gym) {
        throw new BadRequestException(
          'Gym not found and no gym data provided in license key',
        );
      }

      // Create gym with default opening days using ID from token
      gym = this.gymRepository.create({
        id: tokenGymId, // Use ID from token (source of truth)
        name: licenseData.gym.name,
        address: licenseData.gym.address,
        phone: licenseData.gym.phone,
        owner: owner || undefined,
        openingDays: [
          {
            day: 'Monday',
            openingTime: '08:00',
            closingTime: '22:00',
            isOpen: true,
          },
          {
            day: 'Tuesday',
            openingTime: '08:00',
            closingTime: '22:00',
            isOpen: true,
          },
          {
            day: 'Wednesday',
            openingTime: '08:00',
            closingTime: '22:00',
            isOpen: true,
          },
          {
            day: 'Thursday',
            openingTime: '08:00',
            closingTime: '22:00',
            isOpen: true,
          },
          {
            day: 'Friday',
            openingTime: '08:00',
            closingTime: '22:00',
            isOpen: true,
          },
          {
            day: 'Saturday',
            openingTime: '08:00',
            closingTime: '22:00',
            isOpen: true,
          },
          {
            day: 'Sunday',
            openingTime: '08:00',
            closingTime: '22:00',
            isOpen: false,
          },
        ],
      });

      await this.gymRepository.save(gym);
    } else {
      // Gym exists - update owner if provided and gym doesn't have owner
      if (owner && !gym.owner) {
        gym.owner = owner;
        await this.gymRepository.save(gym);
      }
    }

    // Validate the license key using gymId from token
    const validation = await this.validateLicenseKey(
      licenseKey,
      tokenGymId, // Use gymId from token (source of truth)
      gym.licenseKeyActivatedAt,
    );

    if (!validation.valid) {
      throw new BadRequestException(validation.error || 'Invalid license key');
    }

    // Update gym with license key
    gym.licenseKey = licenseKey;
    gym.licenseKeyExpiresAt = licenseData.expiresAt;

    // Only set activatedAt on first activation
    if (!gym.licenseKeyActivatedAt) {
      gym.licenseKeyActivatedAt = new Date();
    }

    await this.gymRepository.save(gym);

    return gym;
  }

  /**
   * Validates a gym's stored license key
   * Used by authentication guards
   */
  async validateGymLicense(gym: GymEntity): Promise<boolean> {
    if (!gym.licenseKey) {
      return false;
    }

    const validation = await this.validateLicenseKey(
      gym.licenseKey,
      gym.id,
      gym.licenseKeyActivatedAt,
    );

    return validation.valid;
  }

  /**
   * Generates a license key for testing/production purposes
   * Uses RS256 (asymmetric) signing with PRIVATE KEY
   * Fetches gym and owner data from database and encodes it in the license
   * Uses active subscription expiration date if expiresAt not provided
   *
   * SECURITY: This method requires LICENSE_PRIVATE_KEY which should ONLY
   * exist on the secure backend server. NEVER bundle the private key in the app.
   *
   * @param gymId - The ID of the gym this license is for
   * @param ownerId - The ID of the owner/manager this license is for
   * @param expiresAt - Optional expiration date. If not provided, uses active subscription's endDate
   * @param issuedAt - When the license was issued (default: now)
   * @returns The generated license key (JWT token signed with RS256)
   *
   * @example
   * const licenseKey = await licenseService.generateLicenseKey(
   *   'gym-uuid-123',
   *   'owner-uuid-456',
   *   new Date('2025-12-31')
   * );
   */
  async generateLicenseKey(
    gymId: string,
    ownerId: string,
    expiresAt?: Date,
    issuedAt: Date = new Date(),
  ): Promise<string> {
    // Fetch gym and owner from database
    const gym = await this.gymRepository.findOne({
      where: { id: gymId },
      relations: ['owner'],
    });

    if (!gym) {
      throw new BadRequestException(`Gym with ID ${gymId} not found`);
    }

    const owner = await this.managerRepository.findOne({
      where: { id: ownerId },
    });

    if (!owner) {
      throw new BadRequestException(`Owner with ID ${ownerId} not found`);
    }

    // Verify owner is the gym's owner
    if (gym.owner?.id !== ownerId) {
      throw new BadRequestException(
        `Owner ${ownerId} is not the owner of gym ${gymId}`,
      );
    }

    // Determine expiration date
    let expirationDate: Date;

    if (expiresAt) {
      // Use provided expiration date
      expirationDate = expiresAt;
    } else {
      // Fetch active subscription to get expiration date
      const subscriptionData =
        await this.gymService.getGymActiveSubscription(gymId);

      if (subscriptionData.activeSubscription?.endDate) {
        // Use subscription's end date
        expirationDate = new Date(subscriptionData.activeSubscription.endDate);
      } else {
        // No active subscription and no custom expiration provided
        throw new BadRequestException(
          'Gym has no active subscription. Please provide a custom expiration date.',
        );
      }
    }

    // Validate expiration date is in the future
    if (expirationDate <= issuedAt) {
      throw new BadRequestException('Expiration date must be in the future');
    }

    // Extract gym seed data (only necessary fields from CreateGymDto)
    // Include gym ID in the seed data (source of truth)
    const gymData: GymSeedData = {
      id: gym.id, // Gym ID from database - will be used on desktop
      name: gym.name,
      address: gym.address || '',
      phone: gym.phone,
    };

    // Extract owner seed data (only necessary fields)
    // Include owner ID in the seed data (source of truth)
    const ownerData: OwnerSeedData = {
      id: owner.id, // Owner ID from database - will be used on desktop
      username: owner.username,
      email: owner.email || undefined,
      firstName: owner.firstName || 'Owner',
      lastName: owner.lastName || 'User',
      phoneNumber: owner.phoneNumber || undefined,
      // Password is NOT included - user must set it on first login or reset
    };

    // Get the PRIVATE KEY for signing (only on backend server)
    const privateKey = this.getPrivateKey();

    // Calculate duration in days for JWT expiration (backward compatibility)
    const durationInDays = Math.ceil(
      (expirationDate.getTime() - issuedAt.getTime()) / (1000 * 60 * 60 * 24),
    );

    // Create the license payload with fetched data
    // IDs are stored inside gym and owner objects (source of truth)
    const payload: LicensePayload = {
      gym: gymData, // Contains gym.id
      owner: ownerData, // Contains owner.id
      issuedAt: Math.floor(issuedAt.getTime() / 1000), // Convert to Unix timestamp (seconds)
      expiresAt: Math.floor(expirationDate.getTime() / 1000), // Convert to Unix timestamp (seconds)
      type: 'desktop-license',
    };

    // Sign with RS256 algorithm using private key
    const licenseKey = this.jwtService.sign(payload, {
      privateKey,
      algorithm: 'RS256', // Asymmetric signing algorithm
      expiresIn: `${durationInDays}d`, // JWT expiration (redundant but adds extra validation layer)
    });

    return licenseKey;
  }
}
