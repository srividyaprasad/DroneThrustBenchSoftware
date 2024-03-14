#include <Servo.h>
const byte RPMsensor = 2;
Servo servo;
volatile unsigned long t_pulse_started_volatile = 0; // Sensor1
volatile unsigned long t_pulse_duration_volatile = 0;
unsigned long t_pulse_started = 0;
unsigned long t_pulse_duration = 0;
int count1=0;
long rpm_sum = 0; // Sensor1
long rpm_reading[100];
long rpm_average = 0;
byte n_max = 0;
byte n = 0;

volatile bool timeout = 1; // Sensor1
volatile bool newpulse = 0;

void setup() {
  Serial.begin(115200);
  attachInterrupt(digitalPinToInterrupt(RPMsensor), ISR_cs, RISING); 
  pinMode(RPMsensor, INPUT);
  /*servo.attach(13);
  Serial.println("Calib of ESC starting");
  delay(1000);
  servo.writeMicroseconds(2000);
  delay(500);
  for (int i = 2000; i >= 1000; i -= 10) {
    servo.writeMicroseconds(i);
    delay(10);
  }
  delay(1000);
  Serial.println("Calib of ESC done..");
  //define interrupts*/
  
}

void loop() {
  sensor();
  Serial.println(rpm_average);
 // servo.writeMicroseconds(1300);
  
}

void sensor() {
  noInterrupts();
  t_pulse_started = t_pulse_started_volatile;
  t_pulse_duration = t_pulse_duration_volatile;
  interrupts();

  if (((micros() - t_pulse_started) > 2000000) && timeout == 0 && newpulse == 0) {

    timeout = 1;
    rpm_average = 0;
    n = 0;

  }

  if (timeout == 0) {

    if (newpulse) {

      rpm_reading[n] = (60000000 / t_pulse_duration);
      n_max = constrain(map(rpm_reading[n], 60, 100000, 0, 100), 0, 100);
      n++;
      newpulse = 0;

      if (n > n_max) {

        for (byte i = 0; i <= n_max; i++) {

          rpm_sum = rpm_sum + rpm_reading[i];
        };
        rpm_average = rpm_sum / (n_max + 1);
        rpm_sum = 0;
        n = 0;
      }
    }
  }
}

void ISR_cs() {
  count1++;
  if(count1 == 7)
 {
  t_pulse_duration_volatile = micros() - t_pulse_started_volatile;
  t_pulse_started_volatile = micros();
  timeout = 0;
  newpulse = 1;
  count1=0;
  }
}
