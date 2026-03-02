export interface Theme {
    name: string;
    colors: {
        focusedBorder: string;
        unfocusedBorder: string;
        modalBorder: string;
        modalBackground: string;
        modalText: string;
        modalTitleText: string;
        modalHintText: string;
        statusBarText: string;
        selectedItem: string;
        selectedItemBg: string;
        activeItem: string;
        inputBackground: string;
        appBackground: string;
    };
}

export const BUILTIN_THEMES: Record<string, Theme> = {
    default: {
        name: 'Default',
        colors: {
            focusedBorder: 'cyan',
            unfocusedBorder: '#FFFFFF',
            modalBorder: 'cyan',
            modalBackground: '#1a1a2e',
            modalText: '#FFFFFF',
            modalTitleText: 'cyan',
            modalHintText: 'gray',
            statusBarText: 'gray',
            selectedItem: '#FFFFFF',
            selectedItemBg: '#264f78',
            activeItem: 'green',
            inputBackground: 'gray',
            appBackground: '#1a1a2e',
        },
    },
    monokai: {
        name: 'Monokai',
        colors: {
            focusedBorder: '#a6e22e',
            unfocusedBorder: '#FFFFFF',
            modalBorder: '#f92672',
            modalBackground: '#272822',
            modalText: '#f8f8f2',
            modalTitleText: '#a6e22e',
            modalHintText: '#75715e',
            statusBarText: '#75715e',
            selectedItem: '#f8f8f2',
            selectedItemBg: '#49483e',
            activeItem: '#e6db74',
            inputBackground: 'gray',
            appBackground: '#272822',
        },
    },
    dracula: {
        name: 'Dracula',
        colors: {
            focusedBorder: '#bd93f9',
            unfocusedBorder: '#FFFFFF',
            modalBorder: '#ff79c6',
            modalBackground: '#282a36',
            modalText: '#f8f8f2',
            modalTitleText: '#bd93f9',
            modalHintText: '#6272a4',
            statusBarText: '#6272a4',
            selectedItem: '#f8f8f2',
            selectedItemBg: '#44475a',
            activeItem: '#50fa7b',
            inputBackground: 'gray',
            appBackground: '#282a36',
        },
    },
    nord: {
        name: 'Nord',
        colors: {
            focusedBorder: '#88c0d0',
            unfocusedBorder: '#FFFFFF',
            modalBorder: '#81a1c1',
            modalBackground: '#2e3440',
            modalText: '#eceff4',
            modalTitleText: '#88c0d0',
            modalHintText: '#4c566a',
            statusBarText: '#4c566a',
            selectedItem: '#eceff4',
            selectedItemBg: '#3b4252',
            activeItem: '#a3be8c',
            inputBackground: 'gray',
            appBackground: '#2e3440',
        },
    },
    gruvbox: {
        name: 'Gruvbox',
        colors: {
            focusedBorder: '#b8bb26',
            unfocusedBorder: '#FFFFFF',
            modalBorder: '#fe8019',
            modalBackground: '#282828',
            modalText: '#ebdbb2',
            modalTitleText: '#b8bb26',
            modalHintText: '#665c54',
            statusBarText: '#665c54',
            selectedItem: '#ebdbb2',
            selectedItemBg: '#3c3836',
            activeItem: '#fabd2f',
            inputBackground: 'gray',
            appBackground: '#282828',
        },
    },
    catppuccin: {
        name: 'Catppuccin',
        colors: {
            focusedBorder: '#cba6f7',
            unfocusedBorder: '#FFFFFF',
            modalBorder: '#f5c2e7',
            modalBackground: '#1e1e2e',
            modalText: '#cdd6f4',
            modalTitleText: '#cba6f7',
            modalHintText: '#585b70',
            statusBarText: '#585b70',
            selectedItem: '#cdd6f4',
            selectedItemBg: '#313244',
            activeItem: '#a6e3a1',
            inputBackground: 'gray',
            appBackground: '#1e1e2e',
        },
    },
};

export const DEFAULT_THEME_NAME = 'default';
