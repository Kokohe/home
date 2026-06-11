#include <stdio.h>
#include <stdint.h>

// main(){
//     int c;
//     c = getchar();

//     while (c != EOF){
//         putchar(c);
//         c = getchar();
//     }
// }

int main(){
    int32_t character;

    while((character = getchar()) != EOF){
        putchar(character);
    };
}

// EXERCISE 1-6 - Verify that the expression 'getchar() != EOF' is 0 or 1

// EXERCISE 1-7 - Write a program to print the value of EOF.