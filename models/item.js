var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var itemSchema = new Schema({
  userId: {type: String},
  name: {type: String},
  price: {type: String}
});

module.exports = mongoose.model("Item", itemSchema);
