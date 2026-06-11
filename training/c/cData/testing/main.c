// Not from the book, just some testing to see how include works across files.

//include just brings the code into this location when compiling
#include "function.c"
#include <stdio.h>

int main(){
    function();
}