import { Controller, Get } from '@nestjs/common';
import { SamplesService } from './samples.service';

@Controller('samples')
export class SamplesController {
  constructor(private samplesService: SamplesService) {}

  @Get('customer-ids')
  async getCustomerIds() {
    return this.samplesService.getCustomerIds();
  }

  @Get('initial-values')
  async getInitialFieldValues() {
    return this.samplesService.getInitialFieldValues();
  }
}
