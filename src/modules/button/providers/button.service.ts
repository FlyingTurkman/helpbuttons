import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { dbIdGenerator } from '@src/shared/helpers/nanoid-generator.helper';
import { Repository } from 'typeorm';
import { CreateButtonDto,UpdateButtonDto } from './button.dto';
import { Button } from './button.entity';

@Injectable()
export class ButtonService {
  constructor(
    @InjectRepository(Button)
    private readonly buttonRepository: Repository<Button>){
  }

  async create(createButtonDto: CreateButtonDto) {
    let button = {
      ...createButtonDto,
      id: dbIdGenerator(),
      location: () => `ST_MakePoint(${createButtonDto.latitude}, ${createButtonDto.longitude})`,
    }
    
    await this.buttonRepository.insert(
      [button]
    );
    return button;
  }

  // async findAll(filters: FilterButtonsDto) {
  //   const { latitude, longitude, radius } = filters;
    
  //   return await this.buttonRepository
  //       .createQueryBuilder()
  //       .where(`ST_Distance(
  //         ST_MakePoint(longitude, latitude)::geography,
  //         ST_MakePoint(${longitude},${latitude})::geography
  //       ) < :range`)
  //       .setParameters({
  //         range:radius*1000 //KM conversion
  //       })
  //      .getRawMany();
  // }

  findOne(id: string) {
    return `This action returns a #${id} button`;
  }

  update(id: string, updateButtonDto: UpdateButtonDto) {
    return `This action updates a #${id} button`;
  }

  remove(id: string) {
    return `This action removes #${id} button`;
  }
}
  