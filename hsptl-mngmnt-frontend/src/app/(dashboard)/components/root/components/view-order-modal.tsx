"use client"

import { useState, useEffect } from "react"
import { MapPin, Package, User, Clock, Truck, Calendar } from "lucide-react"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import Axios from "@/lib/Axios"
import { CreateShipmentModal } from "./create-shipment-modal"

interface OrderProduct {
    id: string
    name: string
    quantity: number
    price: number
    dosage?: string
    category?: string
}

interface Order {
    id: string
    products: OrderProduct[] | string
    destination: string
    account_id?: string
    createdAt: string
    updatedAt: string
    isVerified: boolean
    vendorConfirmed: boolean
    status: string
    vendorCompany?: string
    shipment_id?: string
    shipment?: {
        id: string
        destination: string
        status: string
        start: string
        end: string
        description?: string
        vehicle?: {
            id: string
            name: string
            driver_name: string
            plate_no: string
            type: string
        }
    }
}

interface ViewOrderModalProps {
    isOpen: boolean
    onClose: () => void
    orderId: string | null
}

export function ViewOrderModal({ isOpen, onClose, orderId }: ViewOrderModalProps) {
    const [isLoading, setIsLoading] = useState(true)
    const [order, setOrder] = useState<Order | null>(null)
    const [vendor, setVendor] = useState<any>(null)
    const [isUpdating, setIsUpdating] = useState(false)
    const [isCreateShipmentModalOpen, setIsCreateShipmentModalOpen] = useState(false)
    const { toast } = useToast()

    useEffect(() => {
        if (isOpen && orderId) {
            fetchOrderDetails(orderId)
        }
    }, [isOpen, orderId])

    async function handleVerify(orderId: string) {
        if (!orderId) return
        setIsUpdating(true)
        try {
            await Axios.post("/api/v1/orders/update", {
                id: orderId,
                isVerified: true,
                status: "VERIFIED"
            })

            toast({
                title: "Success",
                description: "Order has been verified successfully",
            })

            // Refresh order data
            fetchOrderDetails(orderId)
        } catch (error) {
            console.error("Error verifying order:", error)
            toast({
                title: "Error",
                description: "Failed to verify order",
                variant: "destructive",
            })
        } finally {
            setIsUpdating(false)
        }
    }

    async function handleConfirm(orderId: string) {
        if (!orderId) return
        setIsUpdating(true)
        try {
            await Axios.post("/api/v1/orders/update", {
                id: orderId,
                vendorConfirmed: true,
                status: "CONFIRMED"
            })

            toast({
                title: "Success",
                description: "Order has been confirmed successfully",
            })

            // Refresh order data
            fetchOrderDetails(orderId)
        } catch (error) {
            console.error("Error confirming order:", error)
            toast({
                title: "Error",
                description: "Failed to confirm order",
                variant: "destructive",
            })
        } finally {
            setIsUpdating(false)
        }
    }

    async function fetchOrderDetails(id: string) {
        setIsLoading(true)
        try {
            const response = await Axios.get("/api/v1/orders/list")
            const orders = response.data.data || []
            const foundOrder = orders.find((o: any) => o.id === id)

            if (foundOrder) {
                // Parse products if it's a string
                if (typeof foundOrder.products === "string") {
                    try {
                        foundOrder.products = JSON.parse(foundOrder.products)
                    } catch (e) {
                        console.error("Error parsing products JSON:", e)
                        foundOrder.products = []
                    }
                }

                setOrder(foundOrder)

                // If there's an account_id, fetch the vendor details
                if (foundOrder.account_id) {
                    fetchVendorDetails(foundOrder.account_id)
                }

                // Check if the order has a shipment or if it's in a shipment
                await fetchShipmentForOrder(foundOrder.id)
            }
        } catch (error) {
            console.error("Error fetching order details:", error)
        } finally {
            setIsLoading(false)
        }
    }

    async function fetchShipmentForOrder(orderId: string) {
        try {
            // First try to get all shipments to find one that contains this order
            const shipmentResponse = await Axios.get("/api/v1/shipment/list")
            const shipments = shipmentResponse.data.data || []

            // Find the shipment that contains this order
            const relatedShipment = shipments.find((shipment: any) =>
                shipment.orders && Array.isArray(shipment.orders) &&
                shipment.orders.some((shipmentOrder: any) => shipmentOrder.id === orderId)
            )

            if (relatedShipment && order) {
                setOrder(prevOrder => ({
                    ...prevOrder!,
                    shipment_id: relatedShipment.id,
                    shipment: {
                        id: relatedShipment.id,
                        destination: relatedShipment.destination,
                        status: relatedShipment.status || "PENDING",
                        start: relatedShipment.start,
                        end: relatedShipment.end,
                        description: relatedShipment.description,
                        vehicle: relatedShipment.vehicle
                    }
                }))
            }
        } catch (error) {
            console.error("Error fetching shipment for order:", error)
        }
    } async function fetchVendorDetails(accountId: string) {
        try {
            // In a real app, you would have an API endpoint to get a single vendor
            const response = await Axios.get("/api/v1/users/list")
            const vendors = response.data.data || []
            const foundVendor = vendors.find((v: any) => (v._id || v.id) === accountId)

            if (foundVendor) {
                setVendor(foundVendor)

                // If the order exists, update it with the vendor company info
                if (order) {
                    setOrder({
                        ...order,
                        vendorCompany: foundVendor.companyName || ''
                    })
                }
            }
        } catch (error) {
            console.error("Error fetching vendor details:", error)
        }
    }

    function formatDate(dateString: string) {
        if (!dateString) return "N/A"
        const date = new Date(dateString)
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        })
    } function calculateTotal() {
        if (!order || !Array.isArray(order.products)) return "$0.00"

        const total = order.products.reduce((sum, product) => {
            return sum + product.price * product.quantity
        }, 0)

        return `$${total.toFixed(2)}`
    }

    // Function to handle successful shipment creation
    function handleShipmentCreated() {
        // Refresh order data to show the new shipment
        if (order) {
            fetchOrderDetails(order.id)
        }
        setIsCreateShipmentModalOpen(false)
    }

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Order Details</DialogTitle>
                        <DialogDescription>View the complete details of this order.</DialogDescription>
                    </DialogHeader>

                    {isLoading ? (
                        <div className="py-8 text-center">Loading order details...</div>
                    ) : !order ? (
                        <div className="py-8 text-center">Order not found</div>
                    ) : (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h3 className="text-sm font-medium flex items-center">
                                        <Package className="mr-2 h-4 w-4 text-muted-foreground" />
                                        Order ID
                                    </h3>
                                    <p className="mt-1">{order.id}</p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium flex items-center">
                                        <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                                        Order Date
                                    </h3>
                                    <p className="mt-1">{formatDate(order.createdAt)}</p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium flex items-center">
                                        <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                                        Destination
                                    </h3>
                                    <p className="mt-1">{order.destination}</p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium flex items-center">
                                        <User className="mr-2 h-4 w-4 text-muted-foreground" />
                                        Vendor
                                    </h3>                                <p className="mt-1">
                                        {vendor ? vendor.name || vendor.username || vendor.email : order.account_id || "N/A"}
                                        {vendor && vendor.companyName && (
                                            <span className="ml-1 text-sm text-muted-foreground">
                                                ({vendor.companyName})
                                            </span>
                                        )}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4 mt-4">
                                <div>
                                    <h3 className="text-sm font-medium">Verification Status</h3>
                                    <Badge className={order.isVerified ? "bg-green-500" : "bg-amber-500"}>
                                        {order.isVerified ? "Verified" : "Pending Verification"}
                                    </Badge>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium">Vendor Confirmation</h3>
                                    <Badge className={order.vendorConfirmed ? "bg-green-500" : "bg-amber-500"}>
                                        {order.vendorConfirmed ? "Confirmed" : "Pending Confirmation"}
                                    </Badge>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium">Order Status</h3>
                                    <Badge className={
                                        order.status === "DELIVERED" ? "bg-green-500" :
                                            order.status === "SHIPPED" ? "bg-blue-500" :
                                                order.status === "CANCELLED" ? "bg-red-500" :
                                                    "bg-amber-500"
                                    }>
                                        {order.status}
                                    </Badge>
                                </div>
                            </div>

                            <Separator />

                            <div>
                                <h3 className="text-sm font-medium mb-2">Products</h3>
                                {Array.isArray(order.products) && order.products.length > 0 ? (
                                    <Table>                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Product</TableHead>
                                            <TableHead>Category</TableHead>
                                            <TableHead>Dosage</TableHead>
                                            <TableHead className="text-right">Quantity</TableHead>
                                            <TableHead className="text-right">Price</TableHead>
                                            <TableHead className="text-right">Subtotal</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                        <TableBody>
                                            {order.products.map((product, index) => (
                                                <TableRow key={index}>
                                                    <TableCell>{product.name}</TableCell>
                                                    <TableCell>{product.category || 'N/A'}</TableCell>
                                                    <TableCell>{product.dosage || 'N/A'}</TableCell>
                                                    <TableCell className="text-right">{product.quantity}</TableCell>
                                                    <TableCell className="text-right">${product.price.toFixed(2)}</TableCell>
                                                    <TableCell className="text-right">${(product.price * product.quantity).toFixed(2)}</TableCell>
                                                </TableRow>
                                            ))}                                        <TableRow>
                                                <TableCell colSpan={5} className="text-right font-medium">
                                                    Total:
                                                </TableCell>
                                                <TableCell className="text-right font-bold">{calculateTotal()}</TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                ) : (
                                    <div className="text-center py-4 border rounded-md border-dashed">
                                        <p className="text-muted-foreground">No products found for this order</p>
                                    </div>
                                )}                        </div>

                            {order.shipment && (
                                <>
                                    <Separator />
                                    <div>
                                        <h3 className="text-sm font-medium mb-3 flex items-center">
                                            <Truck className="mr-2 h-4 w-4 text-muted-foreground" />
                                            Shipment Details
                                        </h3>
                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            <div>
                                                <h4 className="text-xs font-medium text-muted-foreground">Shipment ID</h4>
                                                <p className="text-sm">{order.shipment.id}</p>
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-medium text-muted-foreground">Status</h4>
                                                <Badge className={
                                                    order.shipment.status === "DELIVERED" ? "bg-green-500" :
                                                        order.shipment.status === "IN_TRANSIT" ? "bg-blue-500" :
                                                            order.shipment.status === "DELAYED" ? "bg-amber-500" :
                                                                order.shipment.status === "CANCELLED" ? "bg-red-500" :
                                                                    "bg-slate-500"
                                                }>
                                                    {order.shipment.status}
                                                </Badge>
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-medium text-muted-foreground">Destination</h4>
                                                <p className="text-sm">{order.shipment.destination}</p>
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-medium text-muted-foreground">Schedule</h4>
                                                <p className="text-sm flex items-center">
                                                    <Calendar className="mr-1 h-3 w-3 text-muted-foreground" />
                                                    {formatDate(order.shipment.start)} - {formatDate(order.shipment.end)}
                                                </p>
                                            </div>
                                            {order.shipment.vehicle && (
                                                <>
                                                    <div>
                                                        <h4 className="text-xs font-medium text-muted-foreground">Vehicle</h4>
                                                        <p className="text-sm">{order.shipment.vehicle.name} ({order.shipment.vehicle.type})</p>
                                                    </div>
                                                    <div>
                                                        <h4 className="text-xs font-medium text-muted-foreground">Driver</h4>
                                                        <p className="text-sm">{order.shipment.vehicle.driver_name}</p>
                                                    </div>
                                                    <div>
                                                        <h4 className="text-xs font-medium text-muted-foreground">Plate Number</h4>
                                                        <p className="text-sm">{order.shipment.vehicle.plate_no}</p>
                                                    </div>
                                                </>
                                            )}
                                            {order.shipment.description && (
                                                <div className="col-span-2">
                                                    <h4 className="text-xs font-medium text-muted-foreground">Description</h4>
                                                    <p className="text-sm">{order.shipment.description}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}

                            <div className="flex justify-between items-center">
                                <div>
                                    <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                                        Last Updated: {formatDate(order.updatedAt)}
                                    </Badge>
                                </div>                            <div className="flex gap-2">
                                    {!order.isVerified && (
                                        <Button
                                            variant="outline"
                                            className="border-green-500 text-green-500 hover:bg-green-50"
                                            onClick={() => handleVerify(order.id)}
                                            disabled={isUpdating}
                                        >
                                            {isUpdating ? "Processing..." : "Verify Order"}
                                        </Button>
                                    )}
                                    {order.isVerified && !order.vendorConfirmed && (
                                        <Button
                                            variant="outline"
                                            className="border-blue-500 text-blue-500 hover:bg-blue-50"
                                            onClick={() => handleConfirm(order.id)}
                                            disabled={isUpdating}
                                        >
                                            {isUpdating ? "Processing..." : "Confirm Order"}
                                        </Button>
                                    )}                                {order.isVerified && order.vendorConfirmed && !order.shipment && order.status !== "CANCELLED" && (
                                        <Button
                                            variant="outline"
                                            className="border-purple-500 text-purple-500 hover:bg-purple-50"
                                            onClick={() => setIsCreateShipmentModalOpen(true)}
                                            disabled={isUpdating}
                                        >
                                            <Truck className="h-4 w-4 mr-2" />
                                            Create Shipment
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>        </Dialog>
            {/* Create Shipment Modal */}
            {order && (
                <CreateShipmentModal
                    isOpen={isCreateShipmentModalOpen}
                    onClose={() => setIsCreateShipmentModalOpen(false)}
                    onSuccess={handleShipmentCreated}
                    initialOrderId={order.id}
                />
            )}
        </>
    )
}

