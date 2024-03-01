const express = require('express');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const {get} = require("https");


const app = express();

const basePath = path.resolve(__dirname, 'converted');

app.get('/', (req, res) => {
    res.send('Hello World!');

});

app.get('/image/', async (req, res) => {
    const imageUrl = req.query.query;
    const regex = /cover\/([^/]+)$/
    const match = imageUrl.match(regex);
    let changedName = match[1].replace(/\.\w+$/, '.webp');

    if (fs.existsSync(`./converted/${changedName}`)) {
        res.set('Content-Type', 'image/webp');
        res.sendFile(path.join(basePath, changedName));
    } else {
        if (!fs.existsSync(basePath)) {
            fs.mkdirSync(basePath);
        }
        await download(imageUrl, match[1]);
        res.set('Content-Type', 'image/webp');
        res.sendFile(path.join(basePath, changedName));
    }

});

function download(url, name) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(path.join(basePath, name));
        get(url, function (response) {
            response.pipe(file);
            file.on('finish', async function () {
                file.close();
                await convertImage(`./converted/${name}`);
                resolve();
            });
        }).on('error', function (err) {
            console.error('Error downloading image:', err);
            reject(err);
        });
    });
}

function convertImage(imagePath) {
    return new Promise((resolve, reject) => {
        sharp(imagePath)
            .resize(300)
            .toFormat('webp')
            .toFile(imagePath.replace(/\.\w+$/, '.webp'), (err, info) => {
                if (err) {
                    console.error('Error converting image to WebP:', err);
                    reject(err);
                } else {
                    // Remove the original image after conversion
                    fs.unlinkSync(imagePath);
                    resolve();
                }
            });
    });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});