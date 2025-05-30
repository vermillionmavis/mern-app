import { IsEnum, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";
import { ProductCategory } from "@/enums/product-category.enum";

class CreateProductDTO {
    @IsNotEmpty()
    @IsString()
    name: string

    @IsNumber()
    price: number

    @IsNumber()
    stocks: number
    @IsOptional()
    @IsString()
    dosage?: string

    @IsOptional()
    @IsEnum(ProductCategory)
    category?: ProductCategory

    @IsNotEmpty()
    @IsMongoId()
    account_id: string
}

class UpdateProductDTO {
    @IsNotEmpty()
    @IsMongoId()
    id: string

    @IsOptional()
    @IsString()
    name: string

    @IsOptional()
    @IsNumber()
    price: number

    @IsOptional()
    @IsNumber()
    stocks: number
    @IsOptional()
    @IsString()
    dosage?: string

    @IsOptional()
    @IsEnum(ProductCategory)
    category?: ProductCategory
}


export { CreateProductDTO, UpdateProductDTO }