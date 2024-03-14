#include <Servo.h>
Servo servo;
  
  void setup() {
  // put your setup code here, to run once:
  servo.attach(6);
  delay(1000);
  servo.writeMicroseconds(2000);
  delay(500);
  for(int i=2000;i>=1000;i-=10)
  {
    servo.writeMicroseconds(i);
  delay(10);
  }
  delay(1000);
}

void loop() {
  // put your main code here, to run repeatedly:
  

  servo.writeMicroseconds(1200);
  delay(500);
}
