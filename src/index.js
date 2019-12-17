'use strict'

const path = require("path");
require('dotenv').config({path: path.join(__dirname, './../.env')});

const restify = require('restify')
const mqtt = require('mqtt')

const brokerUrl     = process.env.BROKER_URL
const topicBase     = process.env.TOPIC_BASE
const httpPort      = process.env.HTTP_PORT
const mqttUsername  = process.env.MQTT_USERNAME
const mqttPassword  = process.env.MQTT_PASSWORD


const server = restify.createServer();
server.use(restify.plugins.bodyParser({
    requestBodyOnGet: true
}));

// server.get('*', controller);
server.post('*', controller);

function startHttpServer() {
    server.listen(httpPort, function() {
        console.log('%s listening at %s', server.name, server.url);
    });
}

console.log(`connect mqtt client to ${brokerUrl}`)
const mqttClient  = mqtt.connect(brokerUrl, {
    clientId: "post2mqtt"
    // username: mqttUsername,
    // password: mqttPassword
})

mqttClient.once('connect', () => {
    startHttpServer()
})

mqttClient.once('close', () => {
    process.exit(1) // restart docker container then
})

function controller(req, res, next) {
  const topic = `${topicBase}${req.path().substring(1)}`
  let message = req.body || null
  if (typeof message === 'object') {
      message = JSON.stringify(message)
  }
  mqttClient.publish(topic, message, () => {
    console.log(new Date(), `published on: ${topic}`)
    console.log(new Date(), `message: ${message}`)
    res.send(req.body);
    next();
  })
}