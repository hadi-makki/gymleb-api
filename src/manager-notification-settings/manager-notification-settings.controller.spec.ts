import { Test, TestingModule } from '@nestjs/testing';
import { ManagerNotificationSettingsController } from './manager-notification-settings.controller';
import { ManagerNotificationSettingsService } from './manager-notification-settings.service';

describe('ManagerNotificationSettingsController', () => {
  let controller: ManagerNotificationSettingsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ManagerNotificationSettingsController],
      providers: [ManagerNotificationSettingsService],
    }).compile();

    controller = module.get<ManagerNotificationSettingsController>(ManagerNotificationSettingsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
