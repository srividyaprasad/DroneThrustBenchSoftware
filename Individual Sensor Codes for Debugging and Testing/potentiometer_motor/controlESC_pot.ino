#include<Servo.h>
int pot = A0; 
int pul;
float value;
Servo servo;
 
void setup() {
 pinMode(pot, INPUT);  // declares pin A0 as input
  servo.attach(9);
Serial.begin(115200);
delay(200);
Serial.println("ESC max ");
servo.writeMicroseconds(2000);
delay(2000);
 Serial.println("ESC min ");
servo.writeMicroseconds(1000);
delay(2000);
Serial.println("ESC calibrated ");
}

void loop() {
  value = analogRead(pot);              
  // reads the value of the potentiometer (value between 0 and 1023)  
  pul = map(value, 0, 1023, 1000,1500);         
    servo.writeMicroseconds(pul);
    delay(500);                                   
  }
  
