
export function simplifyTrickName(components: string[]): string {
    const normalized: string[] = [];

    const stance = components[0].toLowerCase();
    const modifier = components[1].toLowerCase();
    const direction = components[2].toLowerCase();
    const trick = components[3].toLowerCase();

    for (let i = 0; i < components.length; i++) {
        const part = components[i].toLowerCase();

        if (part === 'regular' || part === 'body varial' || part === 'revert' || part === '') continue; // Handle special naming conventions (skip over special naming).

        normalized.push(part);
    }

    if (modifier === 'body varial' || modifier === 'revert') normalized.push(modifier); // Handle special naming conventions (special naming order).


    const key = normalized.join(' ');
    // Handle special naming conventions (common ones towards the top finalized).
    const shorthandTrick: Record<string, string> = {
        'nollie ollie' : 'nollie',

        'fs 180 ollie' : 'fs 180',
        'bs 180 ollie' : 'bs 180',
        'fs 360 ollie' : 'fs 360',
        'bs 360 ollie' : 'bs 360',

        'fakie fs 180 ollie' : 'fakie fs 180',
        'fakie bs 180 ollie' : 'fakie bs 180',
        'fakie fs 360 ollie' : 'fakie fs 360',
        'fakie bs 360 ollie' : 'fakie bs 360',

        'nollie fs 180 ollie' : 'nollie fs 180',
        'nollie bs 180 ollie' : 'nollie bs 180',
        'nollie fs 360 ollie' : 'nollie fs 360',
        'nollie bs 360 ollie' : 'nollie bs 360',

        'switch fs 180 ollie' : 'switch fs 180',
        'switch bs 180 ollie' : 'switch bs 180',
        'switch fs 360 ollie' : 'switch fs 360',
        'switch bs 360 ollie' : 'switch bs 360',

        
    };

    

    return shorthandTrick[key] || normalized.join(' ');
}

