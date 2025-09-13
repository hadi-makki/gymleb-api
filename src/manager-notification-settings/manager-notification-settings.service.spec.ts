import { Test, TestingModule } from '@nestjs/testing';
import { ManagerNotificationSettingsService } from './manager-notification-settings.service';

describe('ManagerNotificationSettingsService', () => {
  let service: ManagerNotificationSettingsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ManagerNotificationSettingsService],
    }).compile();

    service = module.get<ManagerNotificationSettingsService>(ManagerNotificationSettingsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
