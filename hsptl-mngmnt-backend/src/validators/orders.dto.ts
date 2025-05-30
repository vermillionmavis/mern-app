import {
    IsArray,
    IsNotEmpty,
    IsString,
    IsMongoId,
    ValidateNested,
    IsNumber,
    Min,
    IsOptional,
    IsBoolean,
    IsEnum,
} from 'class-validator'
import { Type } from 'class-transformer'
import { OrderStatus } from '@/enums/order-status.enum'

class OrderProductDTO {
    @IsString()
    @IsNotEmpty()
    productId: string

    @IsString()
    @IsNotEmpty()
    name: string

    @IsNumber()
    @Min(1)
    quantity: number

    @IsNumber()
    price: number

    @IsOptional()
    @IsString()
    dosage?: string

    @IsOptional()
    @IsString()
    category?: string
}

class CreateOrdersDTO {
    @IsMongoId()
    @IsNotEmpty()
    account_id: string

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => OrderProductDTO)
    products: OrderProductDTO[]
}

class UpdateOrdersDTO {
    @IsMongoId()
    @IsNotEmpty()
    id: string

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => OrderProductDTO)
    @IsOptional()
    products?: OrderProductDTO[]

    @IsBoolean()
    @IsOptional()
    isVerified?: boolean

    @IsBoolean()
    @IsOptional()
    vendorConfirmed?: boolean
    
    @IsEnum(OrderStatus)
    @IsOptional()
    status?: OrderStatus
}

export { CreateOrdersDTO, UpdateOrdersDTO, OrderProductDTO }
