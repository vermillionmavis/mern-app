import prisma from "@/lib/prisma";
import { CreateOrdersDTO, UpdateOrdersDTO } from "@/validators/orders.dto";
import { instanceToPlain } from "class-transformer";
import { OrderStatus } from "@/enums/order-status.enum";

class OrdersService {

    public async getAllOrders() {
        return await prisma.orders.findMany()
    } public async createOrders(data: CreateOrdersDTO) {
        const account = await prisma.account.findUnique({
            where: { id: data.account_id }
        })

        if (!account) {
            return { message: "Account Not Found" }
        } await prisma.orders.create({
            data: {
                products: instanceToPlain(data.products),
                isVerified: false,
                vendorConfirmed: false,
                status: OrderStatus.PENDING,
                account: {
                    connect: {
                        id: account.id
                    }
                }
            }
        })


        return {
            message: "Order Created"
        }
    } public async updateOrders(data: UpdateOrdersDTO) {
        const order = await prisma.orders.findUnique({
            where: {
                id: data.id
            }
        })

        await prisma.orders.update({
            where: {
                id: order?.id
            },
            data: {
                products: instanceToPlain(data.products) || order?.products,
                isVerified: data.isVerified !== undefined ? data.isVerified : order?.isVerified,
                vendorConfirmed: data.vendorConfirmed !== undefined ? data.vendorConfirmed : order?.vendorConfirmed,
                status: data.status || order?.status,
            }
        })


        return {
            message: "Orders Updated Successfully"
        }
    }

    public async deleteOrders(id: string) {
        await prisma.orders.delete({
            where: { id: id }
        })

        return {
            message: "Orders Deleted Successfully"
        }
    }
}

export default OrdersService;
