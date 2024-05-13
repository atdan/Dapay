const mongoose = require("mongoose");

const config = require("./config/index")
const app = require("./app");

mongoose.connect(config.database, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
}).then(() => console.log("DB connection successful at: " + config.database))
.catch((error) => console.error(`DB connection error: ${error}`))


const port = process.env.PORT || 3300;

app.listen(port, () => {
  console.log(`app running on the port ${port}`);
});
