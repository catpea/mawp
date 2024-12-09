export default class Mailbox {
    constructor() {
        this.messages = [];
    }

    enqueue(message) {
        this.messages.push(message);
    }

    dequeue() {
        return this.messages.shift();
    }

    peek() {
        return this.messages[0];
    }
}
