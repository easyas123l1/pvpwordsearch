require("dotenv").config();

const http = require("./socket/socket.js");

const PORT = process.env.PORT || 5000;

http.listen(PORT, () => {
    console.log(`Listening on port ${PORT}...`);
});
