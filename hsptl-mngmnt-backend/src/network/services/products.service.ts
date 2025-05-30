import prisma from "@/lib/prisma";
import { CreateProductDTO, UpdateProductDTO } from "@/validators/products.dto";
import { ProductCategory } from "@/enums/product-category.enum";

class ProductService {

    public async getAllProducts() {
        return await prisma.product.findMany()
    }

    public async createProduct(data: CreateProductDTO) {
        const account = await prisma.account.findUnique({
            where: { id: data.account_id }
        })

        if (!account) {
            return { message: "Account Not Found" }
        } await prisma.product.create({
            data: {
                name: data.name,
                price: data.price,
                stocks: data.stocks,
                dosage: data.dosage,
                category: data.category as ProductCategory || ProductCategory.OTHER,
                // account: {
                //     connect: {
                //         id: account.id
                //     }
                // }
            }
        })

        return {
            message: "Product Created"
        }
    }

    public async updateProducts(data: UpdateProductDTO) {

        const product = await prisma.product.findUnique({
            where: { id: data.id }
        })

        if (!product) {
            return {
                message: "Product Not Found"
            }
        } await prisma.product.update({
            where: { id: product?.id },
            data: {
                name: data.name || product.name,
                price: data.price || product.price,
                stocks: data.stocks || product.stocks,
                dosage: data.dosage !== undefined ? data.dosage : product.dosage,
                category: data.category as ProductCategory || product.category
            }
        })


        return {
            message: "Product Updated Successfully"
        }
    }

    public async deleteProduct(id: string) {
        await prisma.product.delete({
            where: { id: id }
        })

        return {
            message: "Product Deleted Successfully"
        }
    }
}

export default ProductService;
