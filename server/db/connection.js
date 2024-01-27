const mongoose = require('mongoose');

const url = 'mongodb+srv://root:passkey@cluster0.itva8jq.mongodb.net/?retryWrites=true&w=majority'

mongoose.connect(url, {
    // newUrlParser:true,
    // useUnifiedTopology:true
}).then(() => {
    console.log('Databse connected succesfully...');
}).catch((e) => {
    console.log("error", e);
})
