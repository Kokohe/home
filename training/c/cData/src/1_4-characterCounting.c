#include <stdio.h>
#include <stdint.h>

int main(){
    int32_t newCharacter;

    newCharacter = 0;
    while (getchar() != EOF && newCharacter != '\n')
        ++newCharacter;
    printf("%1ld\n", newCharacter);
}

// int main(){
//     double nc;

//     for(nc = 0; getchar() != EOF; ++nc)
//         ;
//     printf("%0f\n", nc);
// }