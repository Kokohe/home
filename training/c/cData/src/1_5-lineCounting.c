#include <stdio.h>
#include <stdint.h>

int main(){
    int32_t character, newLine;

    newLine = 0;
    while((character = getchar()) != EOF)
        if (character == '\n')
            ++newLine;
    printf("%d\n", newLine);
}

////// EXERCISE 1-8 - Write a program to count blanks, tabs, and new lines //////

// int main(){
//     int32_t character, newLine;

//     newLine = 0;
//     while((character = getchar()) != EOF)
//         // this line is changed to \n or \t or ' '
//         if (character == '\n' || character == '\t' || character == ' ')
//             ++newLine;
//     printf("%d\n", newLine);
// }

////// EXERCISE 1-9 - Write a program to copy it's input to it's output, replaceing each string of one or more blanks with a single blank. //////

// int main(){
//     char character;
//     char previousCharacter;
    
//     while((character = getchar())){
//         if (character != ' ' || previousCharacter != character){
//             printf("%c",character);
//         }
//     previousCharacter = character;
//     }
// }

////// EXERCISE 1-10 - Write a program to copy it's input to it's output, replacing each tab by \t, each backspace by \b, and each backslash by \\. This makes tabs and backspaces visible in an unambiguous way. //////

// int main(){
//     char character;
    
//     while((character = getchar())){
//         if (character == '\t'){
//             printf("\\t");
//         }
//         else if(character == '\b'){
//             printf("\\b");
//         }
//         else if(character == '\\'){
//             printf("\\\\");
//         }
//         else{
//             printf("%c", character);
//         }
//     }
// }
