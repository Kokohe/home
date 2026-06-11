#include <stdio.h>
#include <stdint.h>

const int8_t IN = 1;
const int8_t OUT = 0;

int32_t character, newLine, newWord, newCharacter, state;

// int main(){
    
//     state = OUT;
//     newLine = newWord = newCharacter = 0;

//     while((character = getchar()) != EOF){
//         ++newCharacter;
//         if (character == '\n'){
//             ++newLine;
//         }
//         if (character == ' ' || character == '\n' || character == '\t'){
//             state = OUT;
//         }
//         else if (state == OUT){
//             state = IN;
//             ++newWord;
//         }
//     }
//     printf("%d %d %d\n", newLine, newWord, newCharacter);
// }

// EXERCISE 1-11 - How would you test the word count program? What kinds of inputs are most likely to uncover bugs if there are any?

// Empty input
// Input that's only spaces
// Input that starts or ends with spaces
// Multiple spaces between words
// Only newlines

// EXERCISE 1-12 - Write a program that prints it's inputs one word per line.

int main(){
    
    state = OUT;
    newLine = newWord = newCharacter = 0;

    while((character = getchar()) != EOF){
        ++newCharacter;
        if (character == '\n'){
            ++newLine;
        }
        if (character == ' ' || character == '\n' || character == '\t'){
            state = OUT;
        }
        else if (state == OUT){
            state = IN;
            if (newWord > 0){
                printf("\n");
            }
            ++newWord;
            printf("%c",character);
        }
        else {
            printf("%c",character);
        }
    }
}