var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var itemSchema = new Schema({
  name: {type: String},
  price: {type: Number}
});

module.exports = mongoose.model("Item", itemSchema);