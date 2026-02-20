export const BOARD_STYLES = {
    classic: {
        dark: "#779556",
        light: "#ebecd0",
        name: "Classic Forest"
    },
    futuristic: {
        dark: "#2d3446",
        light: "#404b69",
        name: "Cyber Pulse"
    },
    minimal: {
        dark: "#8a8a8a",
        light: "#e0e0e0",
        name: "Monochrome"
    },
    wood: {
        dark: "#b58863",
        light: "#f0d9b5",
        name: "Grandmaster Wood"
    }
};

export const getBoardStyle = (styleName) => {
    return BOARD_STYLES[styleName] || BOARD_STYLES.classic;
};
