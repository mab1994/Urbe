const mongoose = require('mongoose')
const config = require('config')

const database = config.get('mongoURI')

const connectToDB = async () => {
  try {
    await mongoose.connect(database, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      useFindAndModify: false
    })
    console.log('Database connected...')
  } catch (e) {
    console.error(e.message)
    process.exit(1)
  }
}

module.exports = connectToDB
