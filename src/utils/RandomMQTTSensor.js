import mqtt from 'mqtt';

const sensorTypes = [
  'POSITIVE_NUMBER',
  'PERCENT',
  'TEMPERATURE',
  'ON_OFF',
  'OPEN_CLOSE',
];

const Enumeration = function (keys) {
  const enumeration = Object.create(null);
  for (const key of keys) {
    enumeration[key] = key;
  }
  enumeration[Symbol.iterator] = function* () {
    for (const key of keys) {
      yield enumeration[key];
    }
  }
  Object.freeze(enumeration);
  return enumeration;
}

const SensorType = new Enumeration(sensorTypes);


function propName(prop, value) {
  for (var i in prop) {
    if (prop[i] === value) {
      return i;
    }
  }
  return false;
}


const Value = function (value) {
  this.value = value;
  this.toString = () => (this.value);
};
const values = [
  'ON',
  'OFF',
  'OPEN',
  'CLOSE'
];
for (const key of values) {
  Value[key] = new Value(key);
}
Object.freeze(Value);


function randomId() {
  return "" + Math.floor(Math.random() * 1000000);
}

const RandomMQTTSensor = function ({
  id = randomId(),
  name = "nope",
  type = SensorType.TEMPERATURE,
  broker = 'mqtt://mosca',
  freq = 1 }) {
  this.name = name;
  this.id = typeof id === 'undefined' ? randomId() : id;
  this.broker = typeof broker === 'undefined' ? 'mqtt://localhost:1883' : broker;
  this.type = type;

  switch (this.type) { 
    case SensorType.TEMPERATURE: this.value = 10 + Math.floor(Math.random() * 20); break;
    case SensorType.POSITIVE_NUMBER: this.value = Math.floor(Math.random() * 100); break;
    case SensorType.PERCENT: this.value = Math.random(); break;
    case SensorType.ON_OFF: this.value = Math.random() > .05 ? Value.ON : Value.OFF; break;
    case SensorType.OPEN_CLOSE: this.value = Math.random() > .05 ? Value.OPEN : Value.CLOSE; break;
    default: this.value = 0;
  }
  this.freq = typeof freq === 'undefined' ? 1 : Number(freq);
  this.handler = () => { }
}
RandomMQTTSensor.prototype.handler = function (topic, message) {
  // message is Buffer
  console.log(message.toString())

}

RandomMQTTSensor.prototype.send = function () {

  switch (this.type) {
    case SensorType.TEMPERATURE: this.value = this.value - 0.1 + Math.random() * 0.2; break;
    case SensorType.POSITIVE_NUMBER: this.value = this.value - 1 + Math.floor(Math.random() * 3); break;
    case SensorType.PERCENT: this.value = Math.min(1, Math.max(0, this.value - 0.1 + Math.random() * 0.2)); break;
    case SensorType.ON_OFF: if (Math.random() > .9) this.value = this.value === Value.ON ? Value.OFF : Value.ON; break;
    case SensorType.OPEN_CLOSE: if (Math.random() > .9) this.value = this.value === Value.OPEN ? Value.CLOSE : Value.OPEN; break;
    default: this.value = 0;
  }
  //console.log("send", this.value.toString())
  const s = `{"name":"${this.name}", "value":"${this.value.toString()}", "type":"${propName(SensorType, this.type)}"}`
  //console.log('value/' + this.id, s);
  this.client.publish('value/' + this.id, s);
}
RandomMQTTSensor.prototype.start = function () {
  this.client = mqtt.connect(this.broker);
  this.client.on('connect', () => {
    this.client.subscribe('action/' + this.id)
    this.client.publish('presence', this.id)
    this.timeout = setInterval(RandomMQTTSensor.prototype.send.bind(this), 1000 / this.freq)
  })
  this.client.on('message', RandomMQTTSensor.prototype.handler.bind(this));

}
RandomMQTTSensor.prototype.stop = function () {
  clearTimeout(this.timeout);
  this.client.unsuscribe('action/' + this.id);
  this.client.end();
}

export { RandomMQTTSensor, SensorType, Value };