const Order = require('../../models/Order');
const Productos = require('../../models/Productos');
const User = require('../../models/User');


const createOrder = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findById(id);
        if (!user) {
            res.status(404).send("No existe Usuario con ese ID");
            return;
        }

        const productsInfo = req.body.products;

        if (!productsInfo || !Array.isArray(productsInfo) || productsInfo.length === 0) {
            res.status(400).send("La solicitud debe incluir información válida sobre productos.");
            return;
        }

        let total = 0;
        const orderProducts = [];

        for (const { productId, quantity } of productsInfo) {
            if (!productId || !quantity || isNaN(quantity) || quantity <= 0) {
                res.status(400).send("Cada producto debe tener un productId y una cantidad válida.");
                return;
            }

            const product = await Productos.findById(productId);
            if (!product) {
                res.status(404).send(`No existe producto con el ID: ${productId}`);
                return;
            }

            if (quantity > product.stock) {
                res.status(400).send(`La cantidad solicitada para el producto ${productId} supera el stock disponible.`);
                return;
            }

            total += product.price * quantity;

            // Actualiza el stock en la base de datos
            product.stock -= quantity;
            await product.save();

            orderProducts.push({
                product: productId,
                quantity: quantity,
            });
        }

        // Crea la orden utilizando el modelo Order
        const order = new Order({
            products: orderProducts,
            user: user._id,
            total: total,
            status: 'pending',
        });

        await order.save();

        res.status(201).json(order); // 201 indica que se creó con éxito
    } catch (error) {
        console.log(error);
        res.status(500).send("Error interno del servidor");
    }
};
const updateOrder = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            res.status(404).send("No existe orden con esa ID");
            return;
        }

        const { products } = req.body;

        if (!products || !Array.isArray(products) || products.length === 0) {
            res.status(400).send("La solicitud debe incluir información válida sobre productos.");
            return;
        }

        const currentOrder = await Order.findById(id);
        

        if (!currentOrder) {
            res.status(404).send("No se encontró la orden para actualizar.");
            return;
        }

        let newTotal = 0;

        for (const { productId, quantity } of products) {
            if (!productId || !quantity || isNaN(quantity) || quantity <= 0) {
                res.status(400).send("Cada producto debe tener un productId y una cantidad válida.");
                return;
            }
        
            const currentProduct = currentOrder.products.find(p => p.product.toString() === productId);
        
            // console.log("Productos en la orden:", currentOrder.products);
            // console.log("ProductId proporcionado:", productId);
        
            if (!currentProduct) {
                res.status(400).send(`El producto con ID ${productId} no está presente en la orden actual.`);
                return;
            }
        
            const productData = await Productos.findById(productId);
        
            const quantityDiff = quantity - currentProduct.quantity;
            console.log(quantityDiff)
        
            productData.stock -= quantityDiff;
            await productData.save();
        
            newTotal += productData.price * quantity;
            console.log("total:", newTotal)
        
            currentProduct.quantity = quantity;
        }
        currentOrder.total = newTotal;
        const orderUpdate = await currentOrder.save();
        

        res.status(202).send(orderUpdate);
    } catch (error) {
        console.log(error);
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

module.exports = {
    createOrder,
    updateOrder,
    deleteOrder
};




