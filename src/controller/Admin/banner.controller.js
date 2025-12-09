
const Banner = require('../../models/Banner');




// Importa tu modelo de Banner de Mongoose aquí

const getBanner= async(req,res)=>{
    try {
        const banner= await Banner.find();
        if (!banner || banner.length === 0) {
            res.status(404).send("No hay imagenes para mostrar")
            return
        }
        res.status(200).send(banner)
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: error.message })
    }
}


// Rutas para la gestión de banners
const createBanner = async (req, res) => {
  try {
    const { title, link } = req.body;
    const image = req.file.buffer; // La imagen se almacena en req.file.buffer
    console.log("soy la imagen",image)
    const newBanner = new Banner({ title, link, image });
    await newBanner.save();

    res.json({ message: 'Banner creado exitosamente.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al crear el banner.' });
  }
};

const updateBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, link } = req.body;
    const image = req.file.buffer;

    // Encuentra el banner por ID y actualiza los campos
    await Banner.findByIdAndUpdate(id, { title, link, image });

    res.json({ message: 'Banner actualizado exitosamente.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar el banner.' });
  }
};

const deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;

    // Encuentra el banner por ID y elimínalo
    await Banner.findByIdAndDelete(id);

    res.json({ message: 'Banner eliminado exitosamente.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar el banner.' });
  }
};

module.exports = {
  getBanner,
  createBanner,
  updateBanner,
  deleteBanner,
};
