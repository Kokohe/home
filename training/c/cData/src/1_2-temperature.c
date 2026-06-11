// Header files, “menu of available features”
#include <stdio.h>
#include <stdint.h>

const int32_t lower = 0;
const int32_t upper = 300;
const int32_t step = 20;
const char fahrHeader[] = "Fahrenheit";
const char celsiusHeader[] = "Celsius";

int main(){
    //// WHILE LOOP METHOD ////
    float fahr, celsius; 
    fahr = lower;

    printf("%s %s\n", fahrHeader, celsiusHeader);
    while (fahr <= upper){
        celsius = (5.0/9.0) * (fahr-32.0);
        printf("%3.0f %6.1f\n", fahr, celsius);
        fahr = fahr + step; 
    }
    return 0;
}

//  int main(){
        //// FOR LOOP METHOD ////
//      int fahr;

//      printf("%s %s\n", fahrHeader, celsiusHeader);

//      for (fahr = upper; fahr >= lower; fahr = fahr - step)
//          printf("%3d %6.1f\n", fahr, (5.0/9.0)*(fahr-32));
//  }

// EXERCISE 1-3 - Modify the temperature conversion program to print a heading above the table.

// EXERCISE 1-4 - Write a program to print the corresponding Celsius to Fahrenheit table.

// EXERCISE 1-5 - Modify the temperature conversion program to print the table in reverse order, that is, from 300 to 0.
