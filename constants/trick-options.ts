export interface TrickOption {
    label: string;
    value: string;
    type: 'shuvit' | 'flip' | 'heel' | 'other' ;
    noDegrees: boolean;
    modifiers: string[];
};

export const stanceOptions = [
    "regular",
    "fakie",
    "nollie",
    "switch"
];

export const directionOptions = [
    "BS",
    "FS"
];

export const rotationOptions = [
    "BS 180",
    "FS 180",
    "BS 360",
    "FS 360"
];

export const trickOptions = [
    { label: 'Ollie', value: 'ollie', type: 'other', 
        noDegrees:false,
        modifiers:['body varial']},

    { label: 'Shuvit', value: 'shuvit', type: 'shuvit',
        noDegrees:true,
        modifiers:['late', 'body varial', 'revert']},
        
    { label: 'Kickflip', value: 'kickflip', type: 'flip',
        noDegrees:false,
        modifiers:['late', 'pressure', 'body varial']},

    { label: 'Heelflip', value: 'heelflip', type: 'heel',
        noDegrees:false,
        modifiers:['late', 'pressure', 'body varial']},
        
    { label: '360 Shuvit', value: '360 shuvit', type: 'shuvit', 
        noDegrees:true,
        modifiers:['late', 'body varial', 'revert']},

    { label: 'Bigspin', value: 'bigspin', type: 'shuvit', 
        noDegrees:true,
        modifiers:['late', 'body varial']},

    { label: 'Varial Flip', value: 'varial flip', type: 'flip',
        noDegrees:true,
        modifiers:['late', 'pressure', 'body varial', 'revert']},

    { label: 'Varial Heel', value: 'varial heel', type: 'heel',
        noDegrees:true,
        modifiers:['late', 'pressure', 'body varial', 'revert']},

    { label: 'Tre Flip', value: 'tre flip', type: 'flip',
        noDegrees:true,
        modifiers:['pressure', 'body varial', 'revert']},

    { label: 'Laser Flip', value: 'laser flip', type: 'heel',
        noDegrees:true,
        modifiers:['pressure', 'body varial', 'revert']},

    { label: 'Hardflip', value: 'hardflip', type: 'flip',
        noDegrees:false,
        modifiers:['late', 'pressure', 'body varial', 'revert']},

    { label: 'Inward Heel', value: 'inward heel', type: 'heel',
        noDegrees:false,
        modifiers:['late', 'pressure', 'body varial', 'revert']},
    
    { label: 'Impossible', value: 'impossible', type: 'shuvit',
        noDegrees:false,
        modifiers:['front foot']},

    { label: 'Big Flip', value: 'big flip', type: 'flip',
        noDegrees:true,
        modifiers:['revert']},

    { label: 'Big Heel', value: 'big heel', type: 'heel',
        noDegrees:true,
        modifier:['revert']},

    { label: 'Dolphin Flip', value: 'dolphin flip', type: 'flip',
        noDegrees:false,
        modifiers:['late', 'body varial', 'revert']},

    { label: 'Dolphin Heel', value: 'dolphin heel', type: 'heel',
        noDegrees:false,
        modifiers:['late', 'body varial', 'revert']},

    { label: 'Hospital Flip', value: 'hospital flip', type: 'flip',
        noDegrees:false,
        modifiers:['late', 'body varial', 'revert']},

    { label: 'Hospital Heel', value: 'hospital heel', type: 'heel',
        noDegrees:false,
        modifiers:['late', 'body varial', 'revert']},

    { label: 'Double Kickflip', value: 'double kickflip', type: 'flip',
        noDegrees:false,
        modifiers:['late', 'pressure', 'body varial']},

    { label: 'Double Heelflip', value: 'double heelflip', type: 'heel',
        noDegrees:false,
        modifiers:['late', 'pressure', 'body varial']},

    { label: 'Biggerspin', value: 'biggerspin', type: 'shuvit', 
        noDegrees:true,
        modifiers:['revert']},

    { label: 'Bigger Flip', value: 'bigger flip', type: 'flip',
        noDegrees:true,
        modifiers:['revert']},

    { label: 'Bigger Heel', value: 'bigger heel', type: 'heel',
        noDegrees:true,
        modifiers:['revert']},

    { label: '540 Shuvit', value: '540 shuvit', type: 'shuvit', 
        noDegrees:true,
        modifiers:['body varial', 'revert']},

    { label: '540 Flip', value: '540 flip', type: 'flip',
        noDegrees:true,
        modifiers:['revert']},
    
    { label: '540 Heel', value: '540 heel', type: 'heel',
        noDegrees:true,
        modifiers:['revert']},

    { label: 'Gazelle Spin', value: 'gazelle spin', type: 'shuvit', 
        noDegrees:true,
        modifiers:['revert']},

    { label: 'Gazelle Flip', value: 'gazelle flip', type: 'flip',
        noDegrees:true,
        modifiers:['revert']},

    { label: 'Gazelle Heel', value: 'gazelle heel', type: 'heel',
        noDegrees:true,
        modifiers:['revert']},
];

export const modifyOptions = [
    "late", // flip, heel, shuvit
    "pressure", // inward heel, kickflip, heelflip, hardflip
    "body varial", // ollie, non bi-rotational tricks
    'revert'
];
// common words: shuvit, flip, heel, spin, 180, 360, 540