#include <Servo.h>

#define MIN_PULSE_LENGTH 1000 
#define MAX_PULSE_LENGTH 2000 
Servo motA;
char data;
int pwm;

void setup() {
    Serial.begin(115200);
    motA.attach(9, MIN_PULSE_LENGTH, MAX_PULSE_LENGTH);
    displayInstructions();
}

void loop() {
    if (Serial.available()) {
        data = Serial.read();
        
        switch (data) {
            // 0
            case 48 : Serial.println("Sending minimum throttle");
                      motA.writeMicroseconds(MIN_PULSE_LENGTH);
                      if (Serial.read()==0)
                      {motA.writeMicroseconds(1000);}
            break;

            // 1
            case 49 : Serial.println("Sending maximum throttle");
                      motA.writeMicroseconds(MAX_PULSE_LENGTH);
                      if (Serial.read()==0)
                      {motA.writeMicroseconds(1000);}
            break;

            // 2
            case 50 : Serial.print("Running test in 3");
                      delay(1000);
                      Serial.print(" 2");
                      delay(1000);
                      Serial.println(" 1...");
                      delay(1000);
                      test();
                      if (Serial.read()==0)
                      {motA.writeMicroseconds(1000);}
            break;
            case 51 : Serial.println("Enter your desired throttle\n");
                      delay(5000);
                      pwm=Serial.read();
                      Serial.println(pwm);
                      delay(1000);
                      Serial.println("Sending entered throttle");
                      delay(1000);
                      control(pwm);   
                     // motA.writeMicroseconds(pwm);
                      if (Serial.read()==0)
                      {motA.writeMicroseconds(1000);}
            break;
        }
    }
    
}

void stop()
{
    Serial.println("STOP");
    motA.writeMicroseconds(MIN_PULSE_LENGTH);
}
void test()
{
    for (int i = MIN_PULSE_LENGTH; i <= 1500; i += 10) {
        Serial.print("Pulse length = ");
        Serial.println(i);
        
        motA.writeMicroseconds(i);
        
        delay(200);
    }
    for (int i = 1500; i >= MIN_PULSE_LENGTH; i -= 10) {
        Serial.print("Pulse length = ");
        Serial.println(i);
        
        motA.writeMicroseconds(i);
        
        delay(200);
    }
}

void control(int pwm)
{
    for (int i = MIN_PULSE_LENGTH; i <= pwm; i += 10) {
        Serial.print("Pulse length = ");
        Serial.println(i);
        
        motA.writeMicroseconds(i);
        
        delay(200);
    }
    for (int i = pwm; i >= MIN_PULSE_LENGTH; i -= 10) {
        Serial.print("Pulse length = ");
        Serial.println(i);
        
        motA.writeMicroseconds(i);
        
        delay(200);
    }
}

void displayInstructions()
{  
    Serial.println("READY - PLEASE SEND INSTRUCTIONS AS FOLLOWING :");
    Serial.println("\t0 : Send min throttle");
    Serial.println("\t1 : Send max throttle");
    Serial.println("\t2 : Run test function");
    Serial.println("\t3 : Run control function\n");
}
