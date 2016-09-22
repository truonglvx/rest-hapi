var mongoose = require("mongoose");

//TODO: correctly label "model" and "schema" files and objects throughout project
//TODO: add "updated_at" and "created_at" to all resources
//TODO: make sure complex fields are supported for models. Ex:
// var blogSchema = new Schema({
//   title:  String,
//   author: String,
//   body:   String,
//   comments: [{ body: String, date: Date }],
//   date: { type: Date, default: Date.now },
//   hidden: Boolean,
//   meta: {
//     votes: Number,
//     favs:  Number
//   }
// });
//TODO: possibly remove "Schema.extend" and use "Schema.add"
//TODO: look at accessing "model.methods" rather than "model.schema.methods" (NOTE!!! this probably needs to be a switch from model.methods to model.statics)
//TODO: create a field property that can mark it as "duplicate". i.e. any associated models referencing that model will duplicate those fields along with the reference Id
//TODO(cont): this will allow for a shallow embed that will return a list of reference ids with their "duplicate" values, and a full embed that will return the fully embedded references
//TODO: add option for TTL index on eventLogs so they can expire after a certain length of time


module.exports = {
  createModel: function(Schema) {
    return mongoose.model(Schema.methods.collectionName, Schema);
  },
  extendSchemaAssociations: function (Schema) {
    for (var associationKey in Schema.methods.routeOptions.associations) {
      var association = Schema.methods.routeOptions.associations[associationKey];
      if (association.type === "MANY_MANY") {//EXPL: for many-many relationships, association references should exist on both schemas
        var extendObject = {};
        var dataObject = {};
        dataObject[association.model] = { type: mongoose.Schema.Types.ObjectId, ref: association.model };
        if (association.linkingModel) {//EXPL: if a linking model is defined, add it to the association definition
          var linkingModelFile = "../models/linking-models/" + association.linkingModel + ".model";
          var linkingModel = require(linkingModelFile)();
          association.include = {
            through: linkingModel
          };
          for (var objectKey in linkingModel.Schema) {
            var object = linkingModel.Schema[objectKey];
            dataObject[objectKey] = object;
          }
        }
        extendObject[associationKey] = [dataObject];
        Schema = Schema.extend(extendObject);
      } else if (association.type === "ONE_MANY") {//EXPL: for one-many relationships, create a virtual relationship
        if (association.foreignField) {
          Schema.virtual(associationKey, {
            ref: association.model,
            localField: '_id',
            foreignField: association.foreignField
          });
        }
      } else {
        //TODO: define ONE_ONE associations
      }
    }
    return Schema;
  },
  
  associateModels: function (Schema, models) {
    for (var associationKey in Schema.methods.routeOptions.associations) {
      var association = Schema.methods.routeOptions.associations[associationKey];
      if (!association.include) {
        association.include = {};
      }
      association.include.model = models[association.model];
      association.include.as = associationKey;
    }
  }
};