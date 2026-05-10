/**
 * Passenger data model — lifecycle from waiting at a station to delivery.
 * No Phaser dependencies.
 */

export const PassengerState = {
  WAITING: 'waiting',
  BOARDING: 'boarding',
  ONBOARD: 'onboard',
  UNBOARDING: 'unboarding',
  DELIVERED: 'delivered'
};

export default class Passenger {
  constructor(id, targetShape, stationId) {
    this.id = id;
    this.targetShape = targetShape;   // the destination station SHAPE they want
    this.stationId = stationId;       // station they're currently at (null if on train)
    this.trainId = null;              // train they're on (null if at station)
    this.state = PassengerState.WAITING;

    // Animation state (read by renderer)
    this.animT = 0;                   // 0..1 animation progress
    this.slotIndex = -1;              // position index inside train
  }

  startBoarding(trainId) {
    this.state = PassengerState.BOARDING;
    this.trainId = trainId;
    this.stationId = null;
    this.animT = 0;
  }

  finishBoarding() {
    this.state = PassengerState.ONBOARD;
    this.animT = 1;
  }

  startUnboarding(stationId) {
    this.state = PassengerState.UNBOARDING;
    this.stationId = stationId;
    this.animT = 0;
  }

  finishDelivery() {
    this.state = PassengerState.DELIVERED;
    this.trainId = null;
    this.animT = 1;
  }
}
