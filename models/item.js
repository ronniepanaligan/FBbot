var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var itemSchema = new Schema({
  item_id: {type: String},
  title: {type: String}
});

module.exports = mongoose.model("Item", itemSchema);
