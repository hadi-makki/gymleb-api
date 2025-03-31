import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { GymOwnerService } from './gym-owner.service';
import { CreateGymOwnerDto } from './dto/create-gym-owner.dto';
import { UpdateGymOwnerDto } from './dto/update-gym-owner.dto';

@Controller('gym-owner')
export class GymOwnerController {
  constructor(private readonly gymOwnerService: GymOwnerService) {}

  @Post()
  create(@Body() createGymOwnerDto: CreateGymOwnerDto) {
    return this.gymOwnerService.create(createGymOwnerDto);
  }

  @Get()
  findAll() {
    return this.gymOwnerService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.gymOwnerService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateGymOwnerDto: UpdateGymOwnerDto) {
    return this.gymOwnerService.update(+id, updateGymOwnerDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.gymOwnerService.remove(+id);
  }
}
