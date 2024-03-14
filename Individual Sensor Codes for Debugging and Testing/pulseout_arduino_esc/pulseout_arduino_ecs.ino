int pul;
void setup() {
Serial.begin(115200);
delay(200);
Serial.println("ESC max ");
pulseIn(9,HIGH); 
delay(2); //2 ms
pulseIn(9,LOW);
delay(2000);
 Serial.println("ESC min ");
pulseIn(9,HIGH); 
delay(1); //1 ms
pulseIn(9,LOW);
delay(2000);
Serial.println("ESC calibrated ");
}

void loop() {

   for (pul = 1000; pul <= 1500; pul += 20) { 
    pulseIn(9,HIGH); 
    delayMicroseconds(pul); 
     pulseIn(9,LOW);
    delayMicroseconds(20000);
    Serial.println(pul);
    delay(200);                
  }
  for (pul = 1500; pul >= 1000; pul -= 20) {
    pulseIn(9,HIGH); 
    delay(pul); //1 ms
     pulseIn(9,LOW);
    delayMicroseconds(20000);
    Serial.println(pul);
    delay(200);                     
  }
  
/*int ang= analogRead(A0);
int pot= map(ang,0,1023,0,180);
myservo.write(pot);*/
}
