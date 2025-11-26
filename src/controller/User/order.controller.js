const mongoose = require('mongoose');
const Order = require('../../models/Order');
const Productos = require('../../models/Productos');
const User = require('../../models/User');

const createOrder = async (req, res) => {
    try {
        const userId = req.user.id;
        const { products, shippingAddress } = req.body;

        let total = 0;
        const orderProducts = [];

        for (const item of products) {
            const product = await Productos.findById(item.productId);

            if (!product) {
                return res.status(404).json({ message: "Producto no encontrado" });
            }

            const price = product.price;

            orderProducts.push({
                product: product._id,
                quantity: item.quantity,
                price: price,           // ← ESTA ES LA CLAVE
                seller: product.owner   // si manejas marketplace
            });

            total += price * item.quantity;
        }

        const newOrder = await Order.create({
            user: userId,
            products: orderProducts,
            shippingAddress,
            total
        });

        return res.status(201).json(newOrder);

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Error al crear orden" });
    }
};

const updateOrder = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { id } = req.params;
        const { products } = req.body;

        const order = await Order.findById(id).session(session);
        if (!order) {
            return res.status(404).json({ message: "Orden no encontrada." });
        }

        let newTotal = 0;

        for (const { productId, quantity } of products) {
            const orderItem = order.products.find(p => p.product.toString() === productId);

            if (!orderItem) {
                return res.status(400).json({ message: `El producto ${productId} no está en esta orden.` });
            }

            const product = await Productos.findById(productId).session(session);
            if (!product) {
                return res.status(404).json({ message: `Producto no encontrado: ${productId}` });
            }

            const diff = quantity - orderItem.quantity;

            if (diff > 0 && diff > product.stock) {
                return res.status(400).json({ message: `Stock insuficiente para ${product.name}` });
            }

            product.stock -= diff; // si diff es negativo, stock aumenta
            await product.save({ session });

            newTotal += product.price * quantity;
            orderItem.quantity = quantity;
        }

        order.total = newTotal;
        const updatedOrder = await order.save({ session });

        await session.commitTransaction();
        session.endSession();

        res.status(200).json(updatedOrder);

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        res.status(500).json({ message: error.message });
    }
};


const deleteOrder = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            res.status(404).send("No existe Orden con ese id ");
            return;
        }

        const orderToDelete = await Order.findById(id);

        if (!orderToDelete) {
            res.status(404).send("No se encontró la orden para eliminar.");
            return;
        }

        // Recuperar información de productos antes de eliminar la orden
        const productsInfo = orderToDelete.products;

        // Actualizar el stock para cada producto
        for (const productInfo of productsInfo) {
            const product = await Productos.findById(productInfo.product);

            if (product) {
                // Incrementar el stock basado en la cantidad de la orden
                product.stock += productInfo.quantity;
                await product.save();
            }
        }

        // Eliminar la orden después de actualizar el stock
        const deletedOrder = await Order.findByIdAndDelete(id);
       

        res.status(200).send("Se eliminó la orden y se actualizó el stock");
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
};

//**    enpoind para completar la compra // 
//   COLPETAR ORDEN //
// */
const completeOrder = async (req, res) => {
    try {
        const { id } = req.params; // ID de la orden
        const userId = req.user.id; // viene del token

        const order = await Order.findById(id);

        if (!order) {
            return res.status(404).json({ message: "Orden no encontrada" });
        }

        // Verificar si la orden pertenece al usuario autenticado
        if (order.user.toString() !== userId.toString()) {
            return res.status(403).json({ message: "No estás autorizado para completar esta orden." });
        }

        // La orden debe estar pendiente
        if (order.status !== "pending") {
            return res.status(400).json({ message: "La orden ya fue procesada o cancelada." });
        }

        // 🔥 Aquí normalmente validarías el pago real (Stripe/MercadoPago/PayPal)
        // por ahora asumimos que el pago fue aprobado.

        order.status = "paid";
        await order.save();

        return res.status(200).json({
            message: "Compra completada exitosamente",
            order
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Error al completar compra" });
    }
};


module.exports = {
    createOrder,
    updateOrder,
    deleteOrder,
    completeOrder
};




