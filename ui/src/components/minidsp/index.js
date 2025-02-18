import Header from "../Header";
import React, {useEffect, useState} from "react";
import {makeStyles} from "@material-ui/core/styles";
import {
    Button,
    Chip,
    CircularProgress,
    FormControl,
    FormControlLabel,
    Grid,
    Input,
    InputLabel,
    MenuItem,
    Select,
    Switch,
    TextField,
    useTheme
} from "@material-ui/core";
import PublishIcon from "@material-ui/icons/Publish";
import ezbeq from "../../services/ezbeq";
import {useLocalStorage} from "../../services/util";

const useStyles = makeStyles((theme) => ({
    formControl: {
        margin: theme.spacing(1),
        minWidth: 120,
        maxWidth: 300,
    },
    chips: {
        display: 'flex',
        flexWrap: 'wrap',
    },
    chip: {
        margin: 2,
    },
    root: {
        '& .MuiTextField-root': {
            margin: theme.spacing(1),
        },
    }
}));

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
    PaperProps: {
        style: {
            maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
            width: 250,
        },
    },
};

const getStyles = (output, outputs, theme) => {
    return {
        fontWeight:
            outputs.indexOf(output) === -1
                ? theme.typography.fontWeightRegular
                : theme.typography.fontWeightMedium,
    };
};

const SelectableSlots = ({name, values, availableValues, onChange}) => {
    const classes = useStyles();
    const theme = useTheme();
    return (
        <FormControl className={classes.formControl}>
            <InputLabel id={`${name}-label`}>{name}</InputLabel>
            <Select labelId={`${name}-label`}
                    id={name}
                    multiple
                    value={values}
                    onChange={onChange}
                    input={<Input id="select-multiple-chip"/>}
                    renderValue={(selected) => (
                        <div className={classes.chips}>
                            {selected.map((value) => (
                                <Chip key={value} label={value} className={classes.chip}/>
                            ))}
                        </div>
                    )}
                    MenuProps={MenuProps}>
                {availableValues.map(v => (
                    <MenuItem key={`${name}-${v}`}
                              value={v}
                              style={getStyles(v, values, theme)}>
                        {v}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>

    );
};

const Minidsp = ({availableDevices, setSelectedDeviceName, selectedDeviceName, selectedSlotId, setErr}) => {
    const classes = useStyles();
    const [inputs, setInputs] = useLocalStorage(`minidspInputs.${selectedDeviceName}.${selectedSlotId}`, []);
    const [outputs, setOutputs] = useLocalStorage(`minidspOutputs.${selectedDeviceName}.${selectedSlotId}`, []);
    const [commandType, setCommandType] = useLocalStorage(`minidsp.${selectedDeviceName}.commandType`, 'bq')
    const [config, setConfig] = useState(selectedSlotId);
    const [commands, setCommands] = useState('');
    const [overwrite, setOverwrite] = useState(true);
    const [pending, setPending] = useState(false);
    const [inputChannels, setInputChannels] = useState([]);
    const [outputChannels, setOutputChannels] = useState([]);

    const uploadTextCommands = async () => {
        setPending(true);
        try {
            const response = await ezbeq.sendTextCommands(selectedDeviceName, config, inputs, outputs, commandType, commands, overwrite);
            console.debug(response);
        } catch (e) {
            setErr(e);
        } finally {
            setPending(false);
        }
    };

    useEffect(() => {
        if (availableDevices && selectedDeviceName && selectedSlotId) {
            const slot = availableDevices[selectedDeviceName].slots.find(s => s.id === selectedSlotId);
            setInputChannels(Array.from(Array(slot.inputs).keys()).map(i => i+1));
            setOutputChannels(Array.from(Array(slot.outputs).keys()).map(i => i+1));
        }
    }, [availableDevices, selectedDeviceName, selectedSlotId]);

    useEffect(() => {
        if (inputs.some(i => !inputChannels.includes(i))) {
            setInputs(inputs.filter(i => inputChannels.includes(i)))
        }
    }, [setInputs, inputChannels, inputs]);

    useEffect(() => {
        if (outputs.some(i => !outputChannels.includes(i))) {
            setOutputs(outputs.filter(i => outputChannels.includes(i)))
        }
    }, [setOutputs, outputChannels, outputs]);

    return (
        <>
            <Header availableDeviceNames={Object.keys(availableDevices)}
                    setSelectedDeviceName={setSelectedDeviceName}
                    selectedDeviceName={selectedDeviceName}>
            </Header>
            <form className={classes.root} noValidate autoComplete="off">
                <Grid container>
                    <Grid container justify="space-evenly" alignItems="center">
                        <Grid item>
                            <FormControl className={classes.formControl}>
                                <InputLabel id="config-label">Config</InputLabel>
                                <Select labelId="config-label"
                                        id="config"
                                        value={config}
                                        onChange={e => setConfig(e.target.value)}>
                                    {[1, 2, 3, 4].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Grid>
                        {
                            inputChannels.length > 0
                                ?
                                <Grid item>
                                    <SelectableSlots name={'Input'}
                                                     key={'input'}
                                                     onChange={e => setInputs(e.target.value.sort())}
                                                     availableValues={inputChannels}
                                                     values={inputs}/>
                                </Grid>
                                : null
                        }
                        {
                            outputChannels.length > 0
                                ?
                                <Grid item>
                                    <SelectableSlots name={'Output'}
                                                     key={'output'}
                                                     onChange={e => setOutputs(e.target.value.sort())}
                                                     availableValues={outputChannels}
                                                     values={outputs}/>
                                </Grid>
                                : null
                        }
                        <Grid item>
                            <FormControlLabel
                                control={<Switch checked={overwrite}
                                                 onChange={e => setOverwrite(e.target.checked)}
                                                 color="default"
                                                 name="overwrite"/>}
                                labelPlacement="top"
                                label="Overwrite?"/>
                        </Grid>
                        <Grid item>
                            <FormControl className={classes.formControl}>
                                <InputLabel id="mode-label">Mode</InputLabel>
                                <Select labelId="mode-label"
                                        id="mode"
                                        value={commandType}
                                        onChange={e => setCommandType(e.target.value)}>
                                    <MenuItem key={'bq'} value={'bq'}>Biquads</MenuItem>
                                    <MenuItem key={'filt'} value={'filt'}>Filters</MenuItem>
                                    <MenuItem key={'rs'} value={'rs'}>RS</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item>
                            <Button variant="outlined"
                                    color="primary"
                                    onClick={uploadTextCommands}
                                    disabled={commands.length === 0}
                                    startIcon={pending ? <CircularProgress size={24}/> :
                                        <PublishIcon fontSize="small"/>}>
                                Upload
                            </Button>
                        </Grid>
                    </Grid>
                    <Grid container item>
                        <TextField id="commands"
                                   label={commandType === 'bq' ? 'Biquads' : commandType === 'filt' ? 'Filters' : 'Minidsp RS'}
                                   multiline
                                   rows={26}
                                   fullWidth
                                   value={commands}
                                   onChange={e => setCommands(e.target.value)}
                                   variant="outlined"/>
                    </Grid>
                </Grid>
            </form>
        </>
    );
}

export default Minidsp;