import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { ProductService } from './product.service';

@ApiTags('products')
@ApiBearerAuth()
@UseGuards(SessionAuthGuard)
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  @ApiOperation({ summary: 'List all available products' })
  getAllProducts() {
    return this.productService.getAllProducts();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  getProductById(@Param('id') id: string) {
    return this.productService.getProductById(id);
  }
}
