import React, { useState } from 'react';
import Joyride, { STATUS } from 'react-joyride';

export const AdminTour = ({ run, setRun }) => {
    const [steps] = useState([
        {
            target: 'h1',
            content: 'Welcome to the ChessMaster Command Center! This is your primary tactical overview.',
            placement: 'bottom',
        },
        {
            target: '.prism-grid',
            content: 'These live counters show match movements, user events, and system alerts in real-time.',
        },
        {
            target: 'button:contains("Search Commands")',
            content: 'Press Cmd+K anywhere to open the Tactical Command Palette for instant navigation.',
        },
        {
            target: 'div:contains("Online Count")',
            content: 'Monitor currently active operatives connected to the grid.',
        },
        {
            target: 'nav',
            content: 'Use the sidebar to manage operatives, view battlegrounds, and adjust system protocols.',
        },
    ]);

    const handleJoyrideCallback = (data) => {
        const { status } = data;
        if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
            setRun(false);
        }
    };

    return (
        <Joyride
            steps={steps}
            run={run}
            continuous={true}
            showProgress={true}
            showSkipButton={true}
            callback={handleJoyrideCallback}
            styles={{
                options: {
                    primaryColor: '#06b6d4',
                    backgroundColor: '#0a0a0c',
                    textColor: '#ffffff',
                    arrowColor: '#0a0a0c',
                },
            }}
        />
    );
};
