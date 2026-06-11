#include <stdio.h>

int main (){
    int character, i /*index*/, whiteCount, otherCount;
    int nDigit[10];

    whiteCount = otherCount = 0;

    for (i = 0; i < 10; ++i)
        nDigit[i] = 0;
    while ((character = getchar()) != EOF){
        if (character >= '0' && character <= '9')
            ++nDigit[character-'0'];
        else if (character == ' ' || character == '\n' || character == '\t')
            ++whiteCount;
        else
            ++otherCount;
    printf("Digits =");
    for (i = 0; i < 10; ++i)
        printf(" %d", nDigit[i]);
    printf(", White space = %d, other = %d\n", whiteCount, otherCount);
    }
}