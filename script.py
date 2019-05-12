def main():
    comma_separated_string = input('mcja')
    list_of_strings = comma_separated_string.split(',')
    list_of_ints = list_of_strings.map(int)
    print(list_of_ints)


main()