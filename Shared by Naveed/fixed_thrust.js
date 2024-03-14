/* //////////////// Description ////////////////

"I" controller for going to multiple predefined thrust values.

///////////// User defined variables //////////// */

var minVal = 1100;         // Min. input value [700us, 2300us] ESC INIT VALUE
var maxVal = 1940;         // Max. input value [700us, 2300us]
var filePrefix = "THRUST_I";
var listOfThrusts = [2.300]; // Target thrusts (kg)
var thrustDurations = [10]; // Duration to stay at each thurst point (seconds). Does not include when out of stable region.
var sampleRate = 0.03; // How often to record a sample to file (every x seconds)

///////////////// Tweaking variables //////////////////
var Iterm = 0.04; // how fast to integrate towards goal thrust (increase if too slow, decrease if oscillations)
var stableTol = 0.025; // Thrust that the system can assume stable (note that 1uS ESC output resolution may cause thrust to oscillate within this value this is totally normal and unavoidable)
var maxRATE = 20; // us/sec rate for the ramp towards target thrust
var minRATE = 1; // us/sec min rate towards goal (set too low and it may take a while for target to be reached. This forces evolution even when very close to target)
var advancethrust = 0.03; // when ramping, will stop in advance (before target) to minimize overshoot due to system/ESC delays and intertia. Will speed up target if adjusted to custom use. Leave to 0 if unsure.
var signChanges = 5; // system considered stable when sign changes this many times while withing tolerance. This method is effective because it ensures the system is not within tolerance but still converging to setpoint: it has to oscillate around the setpoint.

///////////////// Beginning of the script //////////////////

//Track thrust points as script executes
var currPointIndex = -1;
var currthrust = 0;
var timer = 0; //time left before going to next point
var currPWM;
nextPoint();

//Time since last data sample
var timeSample = 0;

//Keeps track of console messages
var msgEscOutput;
var msgSamplesSaved;
var msgStableStatus;
var thrustTargetInfo;
var samplesCounter = 0;

//Set hard thrust limit (to avoid spoolup if PID does not work well)
var sequenceMaxThrust = listOfThrusts[listOfThrusts.length-1] + 0.4;

rcb.console.setVerbose(false);

//Start new log file
rcb.files.newLogFile({prefix: filePrefix});

//ESC initialization
msgEscOutput = rcb.console.print("Initializing ESC... " + minVal + "us for 4 seconds...");
rcb.output.pwm("esc",minVal);
rcb.wait(readSensor, 4);
msgSamplesSaved = rcb.console.print(" ");
thrustTargetInfo = rcb.console.print(" ");
msgStableStatus = rcb.console.print("Test will start after ESC initialization");

function readSensor(){
    rcb.sensors.read(readDone, 1);
}

// Calculate the new setpoint
function nextPoint(){
    // go to the next set point
    // or finish script
    currPointIndex++;
    if(currPointIndex < listOfThrusts.length){
        currthrust = listOfThrusts[currPointIndex];  
        timer = thrustDurations[currPointIndex];
    }else{
        rcb.endScript();
    }
}

// basic I controller
function Icont(target, current){

    // init
    if(!Icont.lastOutput || target === 0){
        Icont.lastOutput = minVal;
        Icont.I = Iterm;
        Icont.stableTol = stableTol; //target tolerance (rpm)
        Icont.lastSampleTimestamp = window.performance.now(); //time in ms;
        Icont.stableFilter = [];
        Icont.maxRATE = maxRATE;// us / sec
        Icont.minRATE = minRATE; // us / sec
        Icont.lastTarget = 0; // rpm
        Icont.stable = false;
        return {
            output: Icont.lastOutput,
            stable: target === 0
        };
    }
    
    // determine the direction of the step
    if(target !== Icont.lastTarget){
        Icont.targetUp = (target > Icont.lastTarget);
        Icont.lastTarget = target;
        Icont.targetReached = false;
    }
    
    // determine if target has been crossed
    if(Icont.targetUp && current>target-advancethrust){
        Icont.targetReached = true;
    }
    if(!Icont.targetUp && current<target+advancethrust){
        Icont.targetReached = true;
    }
    
    // calculate the framerate
    var currTimeMs = window.performance.now(); //time in ms
    var dt = 0.001 * (currTimeMs - Icont.lastSampleTimestamp); // in seconds
    Icont.lastSampleTimestamp = currTimeMs;
    
    // calculate the error
    var err = target - current;
    //rcb.console.print(' ');
    //rcb.console.print('Target: ' + target);
    //rcb.console.print('Current: ' + current);
    //rcb.console.print('Err: ' + err);
    
    // calculate the controller output
    var I = err * Icont.I * dt;
    //rcb.console.print('I: ' + I);
    
    // clamp the output rate of change
    var change = I;
    //rcb.console.print('Change: ' + change);
    var maxChange = Icont.maxRATE * dt;
    var minChange = Icont.minRATE * dt;
    var ramping = false;
    if(change>maxChange || (!Icont.targetReached && Icont.targetUp)){
        change = maxChange;
        rcb.console.overwrite('Ramping throttle towards target...',msgStableStatus);
        ramping = true;
    }
    if(change<-maxChange || (!Icont.targetReached && !Icont.targetUp)){
        change = -maxChange;
        rcb.console.print('Ramping');
        ramping = true;
    }
    // minimum evolution speeds up stability
    if(Math.abs(change)<minChange){
        if(target > current){
            change = minChange;
        }else{
            change = -minChange;
        }
    }
    
    var output = Icont.lastOutput + change;
    //rcb.console.print('output: ' + output);
    if(output>maxVal){
        output = maxVal;
    }
    if(output<minVal){
        output = minVal;
    }
    
    // check if reading stable
    // stable if sign of error changed multiple times while rpm is within tolerance
    if(Math.abs(err) < Icont.stableTol){
        if(Icont.lastSign !== (err<0)){
            Icont.lastSign = (err < 0);
            if(Icont.signChange++ >= signChanges){
                Icont.stable = true;
            }
        }
        var percent = Math.round(100*Icont.signChange/signChanges);
        if(percent<=100){
            rcb.console.overwrite('Stability check: ' + percent + '%',msgStableStatus);
        }
    }else{
        Icont.signChange = 0;
        Icont.stable = false;
        if(!ramping){
            rcb.console.overwrite('Converging to stable point...',msgStableStatus);
        }
    }
    
    // save the result
    Icont.lastOutput = output;
    
    // return the result
    return {
        output: Math.round(output),
        stable: Icont.stable,
        dt: dt
    };
}

var dataArray = [];
function readDone(result){

    //Get the target and current
    // get current RPM and check if target reached
    var thrust = result.thrust.workingValue;
    var target = currthrust;
    var current = thrust;
    
    // stop if optical rpm stopped working and final speed passed
    if(result.thrust.workingValue > sequenceMaxThrust){
        rcb.console.error("Sensor problem. thrust passed over: " + sequenceMaxthrust);
    }
    
    // Calculate the P term
    var res = Icont(target, current);
    rcb.output.pwm("esc",res.output);
    rcb.console.overwrite("ESC at: " + res.output + "us",msgEscOutput);
    
    rcb.console.overwrite("Target: " + target + "kg. Time left: " + math.round(timer) + " seconds", thrustTargetInfo);
    
    if(res.stable){
        rcb.console.overwrite('Thrust is stable',msgStableStatus);
        timer -= res.dt;
        
        if(timer <= 0){
            nextPoint();
            dataArray = [];
        }
    }else{
        dataArray = [];
    }
    
    // Save the data at a specific interval rate
    if(res.dt){
        timeSample += res.dt;
    }
    dataArray.push(result);
    if(timeSample >= sampleRate){
        timeSample = 0;
        var average = rcb.sensors.averageResultsArray(dataArray);
        rcb.files.newLogEntry(average);
        samplesCounter++;
        rcb.console.overwrite("Sampling every " + sampleRate + " seconds. " + samplesCounter + " samples recorded", msgSamplesSaved);
    }
    
    // Loop
    readSensor();
}