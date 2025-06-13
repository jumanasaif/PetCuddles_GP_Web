const mongoose = require('mongoose');

const AdoptionQuestionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
  },
});

const AdoptionQuestion = mongoose.model('AdoptionQuestion', AdoptionQuestionSchema);

module.exports = AdoptionQuestion;
