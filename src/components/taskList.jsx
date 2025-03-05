import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, Button, TextField, Select, MenuItem, IconButton,
    Dialog, DialogTitle, DialogContent, DialogActions,
    RadioGroup, FormControlLabel, Radio, Tooltip, Box, Typography,
    CircularProgress, Alert, FormControl, InputLabel,
    Collapse, Grid, Chip, Avatar,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import BlockIcon from '@mui/icons-material/Block';
import BuildIcon from '@mui/icons-material/Build';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'; // Icon for expanding rows
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

const API_URL = process.env.REACT_APP_API_URL;

// Configure axios base URL
const api = axios.create({
    baseURL: API_URL
});

function TaskList() {
    const [tasks, setTasks] = useState([]);
    const [newTask, setNewTask] = useState({  // Use a single object for the new task
        title: '',
        description: '',
        task_type: 'general',
        assigned_to: '', // Changed from assigned_to_id to assigned_to
        due_date: null,
        estimated_hours: null,
        related_app: '',
        related_file: '',
        api_endpoint: '',
        ocr_engine: '',
    });
    const [editTask, setEditTask] = useState(null); // Add state for editing task
    const [openAddDialog, setOpenAddDialog] = useState(false);
    const [openEditDialog, setOpenEditDialog] = useState(false); // Add state for edit dialog
    const [openUploadDialog, setOpenUploadDialog] = useState(false);
    const [uploadOption, setUploadOption] = useState('direct_llm');
    const [selectedFiles, setSelectedFiles] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [filterType, setFilterType] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all'); // Add status filter state
    const [expanded, setExpanded] = useState({});  // Track expanded rows: { taskId: boolean }

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get('/tasks/');
            setTasks(response.data);
        } catch (err) {
            setError('Failed to fetch tasks.');
            console.error("Error fetching tasks:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddTask = async () => {
        if (!newTask.title.trim() || !newTask.description.trim()) {
            setError("Title and Description cannot be empty");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const response = await api.post('/tasks/', newTask); // Send the entire newTask object
            setTasks([...tasks, response.data]);
            setNewTask({ // Reset newTask to initial values
                title: '',
                description: '',
                task_type: 'general',
                assigned_to: '',
                due_date: null,
                estimated_hours: null,
                related_app: '',
                related_file: '',
                api_endpoint: '',
                ocr_engine: '',
            });
            setOpenAddDialog(false);
            setSuccessMessage('Task added successfully!');
        } catch (err) {
            setError('Failed to add task.');
            console.error("Error adding task:", err);
        } finally {
            setLoading(false);
            setTimeout(() => setSuccessMessage(null), 5000);
        }
    };

    const handleUpdateTask = async (taskId, updatedFields) => { // More flexible update
      setLoading(true);
      setError(null);
      try {
          const response = await api.patch(`/tasks/${taskId}/`, updatedFields);
          setTasks(prevTasks =>
              prevTasks.map(task =>
                  task.id === taskId ? response.data : task
              )
          );
           setSuccessMessage('Task Updated successfully!');
      } catch (err) {
          setError('Failed to update task.');
          console.error("Error updating task:", err);
      } finally {
          setLoading(false);
           setTimeout(() => setSuccessMessage(null), 5000); // Hide success message after 5 seconds
      }
  };


    const handleDeleteTask = async (taskId) => {
        setLoading(true);
        setError(null);
        try {
            await api.delete(`/tasks/${taskId}/`);
            setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
            setSuccessMessage("Task deleted successfully");
        } catch (err) {
            setError('Failed to delete task.');
            console.error("Error deleting task:", err);
        } finally {
            setLoading(false);
            setTimeout(() => setSuccessMessage(null), 5000);
        }
    };

    const handleFileUpload = async () => {
      // ... (File upload logic remains the same - see previous response) ...
      // Note: You *still* need to implement your backend /api/llm/upload-receipt/ endpoint
        setLoading(true);
        setError(null);

        const formData = new FormData();
        if(selectedFiles){
            for(let i = 0; i < selectedFiles.length; i++){
                formData.append('images', selectedFiles[i]);
            }
        }

        formData.append('mode', uploadOption);

        try{
            // const response = await api.post('/api/llm/upload-receipt/', formData, {
            //     headers:{
            //         'Content-Type': 'multipart/form-data',
            //     },
            // });
            // console.log(response.data);
            //setSuccessMessage('File uploaded and processed successfully');
            setSuccessMessage("Placeholder: File upload and processing would happen here."); // Placeholder
            setOpenUploadDialog(false);

        }catch(err){
            setError("File upload failed");
            console.error("Error uploading File", err)

        }finally{
            setLoading(false);
             setTimeout(() => setSuccessMessage(null), 5000); // Hide success message after 5 seconds
        }
    };

    const handleFileChange = (event) => {
        setSelectedFiles(event.target.files);
    };

    const getStatusIcon = (status) => {
      // ... (getStatusIcon function remains the same) ...
        switch (status) {
            case 'completed':
                return <CheckCircleOutlineIcon color="success" />;
            case 'in_progress':
                return <HourglassEmptyIcon color="primary" />;
            case 'blocked':
                return <BlockIcon color="error" />;
            case 'testing':
                return <BuildIcon color="secondary" />;
            default:
                return null;
        }
    };

    const handleExpandClick = (taskId) => {
        setExpanded(prevExpanded => ({
            ...prevExpanded,
            [taskId]: !prevExpanded[taskId] // Toggle expansion for the clicked task
        }));
    };

    const handleInputChange = (field, value) => {
        setNewTask(prev => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleEditClick = (task) => {
        setEditTask({
            ...task,
            assigned_to: task.assigned_to || '', // Changed to use assigned_to directly
            due_date: task.due_date ? task.due_date.split('T')[0] : null // Format date for input
        });
        setOpenEditDialog(true);
    };

    const handleEditTask = async () => {
        if (!editTask.title.trim() || !editTask.description.trim()) {
            setError("Title and Description cannot be empty");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const response = await api.put(`/tasks/${editTask.id}/`, editTask);
            setTasks(prevTasks =>
                prevTasks.map(task =>
                    task.id === editTask.id ? response.data : task
                )
            );
            setOpenEditDialog(false);
            setSuccessMessage('Task updated successfully!');
        } catch (err) {
            setError('Failed to update task.');
            console.error("Error updating task:", err);
        } finally {
            setLoading(false);
            setTimeout(() => setSuccessMessage(null), 5000);
        }
    };

    const handleEditInputChange = (field, value) => {
        setEditTask(prev => ({
            ...prev,
            [field]: value,
        }));
    };

    const filteredTasks = tasks.filter(task => {
        // Apply both type and status filters
        const matchesType = filterType === 'all' || task.task_type === filterType;
        const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
        return matchesType && matchesStatus;
    });

    const getStatusStyle = (status) => {
        const styles = {
            completed: { bgcolor: '#e8f5e9', color: '#2e7d32', borderColor: '#81c784' },
            in_progress: { bgcolor: '#e3f2fd', color: '#1976d2', borderColor: '#64b5f6' },
            blocked: { bgcolor: '#ffebee', color: '#d32f2f', borderColor: '#e57373' },
            testing: { bgcolor: '#fff3e0', color: '#f57c00', borderColor: '#ffb74d' },
            not_started: { bgcolor: '#f5f5f5', color: '#757575', borderColor: '#bdbdbd' }
        };
        return styles[status] || styles.not_started;
    };

    return (
        <Box sx={{ p: 3, maxWidth: 1200, margin: '0 auto' }}>
            <Typography 
                variant="h4" 
                gutterBottom 
                sx={{ 
                    borderBottom: '2px solid #1976d2',
                    paddingBottom: 1,
                    marginBottom: 3,
                    textAlign: 'center',
                    fontWeight: 600
                }}
            >
                Project Tasks Management
            </Typography>

            {successMessage && (
                <Alert severity="success" sx={{ mb: 2 }}>
                    {successMessage}
                </Alert>
            )}

            {error && (
                <Alert severity='error' sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <Box sx={{ 
                mb: 3, 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                gap: 2,
                backgroundColor: '#f5f5f5',
                padding: 2,
                borderRadius: 1
            }}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <Button 
                        variant="contained" 
                        onClick={() => setOpenAddDialog(true)} 
                        disabled={loading}
                        sx={{ 
                            backgroundColor: '#1976d2',
                            '&:hover': { backgroundColor: '#115293' }
                        }}
                    >
                        Add Task
                    </Button>

                    <FormControl sx={{ minWidth: 200 }}>
                        <InputLabel id="task-filter-label">Filter by Type</InputLabel>
                        <Select
                            labelId="task-filter-label"
                            value={filterType}
                            label="Filter by Type"
                            onChange={(e) => setFilterType(e.target.value)}
                            size="small"
                        >
                            <MenuItem value="all">All Types</MenuItem>
                            <MenuItem value="ocr_script">OCR Script Tasks</MenuItem>
                            <MenuItem value="api_endpoint">API Endpoint Tasks</MenuItem>
                            <MenuItem value="frontend_ui">Frontend UI Tasks</MenuItem>
                            <MenuItem value="model_creation">Model Creation Tasks</MenuItem>
                            <MenuItem value="authentication">Authentication Tasks</MenuItem>
                            <MenuItem value="prompt_tuning">Prompt Tuning Tasks</MenuItem>
                            <MenuItem value="general">General Tasks</MenuItem>
                        </Select>
                    </FormControl>

                    <FormControl sx={{ minWidth: 200 }}>
                        <InputLabel id="status-filter-label">Filter by Status</InputLabel>
                        <Select
                            labelId="status-filter-label"
                            value={filterStatus}
                            label="Filter by Status"
                            onChange={(e) => setFilterStatus(e.target.value)}
                            size="small"
                        >
                            <MenuItem value="all">All Statuses</MenuItem>
                            <MenuItem value="not_started">Not Started</MenuItem>
                            <MenuItem value="in_progress">In Progress</MenuItem>
                            <MenuItem value="blocked">Blocked</MenuItem>
                            <MenuItem value="completed">Completed</MenuItem>
                            <MenuItem value="testing">Testing</MenuItem>
                        </Select>
                    </FormControl>
                </Box>

                <Button
                    variant="contained"
                    startIcon={<CloudUploadIcon />}
                    onClick={() => setOpenUploadDialog(true)}
                    sx={{ 
                        backgroundColor: '#2e7d32',
                        '&:hover': { backgroundColor: '#1b5e20' }
                    }}
                >
                   Upload Receipt
                </Button>
            </Box>

             {/* Add Task Dialog */}
			<Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} fullWidth maxWidth="md">
				<DialogTitle>Add New Task</DialogTitle>
				<DialogContent>
					<Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
						<TextField
							autoFocus
							margin="dense"
							label="Task Title"
							fullWidth
							variant="outlined"
							value={newTask.title}
							onChange={(e) => handleInputChange('title', e.target.value)}
						/>
						<FormControl fullWidth margin="dense">
							<InputLabel id="task-type-label">Task Type</InputLabel>
							<Select
								labelId="task-type-label"
								value={newTask.task_type}
								label="Task Type"
								onChange={(e) => handleInputChange('task_type', e.target.value)}
							>
								<MenuItem value="general">General Task</MenuItem>
								<MenuItem value="ocr_script">OCR Script</MenuItem>
								<MenuItem value="api_endpoint">API Endpoint</MenuItem>
								<MenuItem value="frontend_ui">Frontend UI</MenuItem>
                                <MenuItem value="model_creation">Model Creation</MenuItem>
                                <MenuItem value="authentication">Authentication</MenuItem>
                                <MenuItem value="prompt_tuning">Prompt Tuning</MenuItem>
							</Select>
						</FormControl>

                        <TextField
                            margin="dense"
                            label="Task Description"
                            fullWidth
                            variant="outlined"
                            multiline
                            rows={4}
                            value={newTask.description}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                        />
						<TextField
                            margin="dense"
                            label="Assigned To"
                            fullWidth
                            variant="outlined"
                            value={newTask.assigned_to}
                            onChange={(e) => handleInputChange('assigned_to', e.target.value)}
                            placeholder="Enter assignee name"
                        />

                        <TextField
                            margin="dense"
                            label="Due Date"
                            type="date"
                            fullWidth
                            variant="outlined"
                            InputLabelProps={{ shrink: true }}
                            value={newTask.due_date || ''}
                            onChange={(e) => handleInputChange('due_date', e.target.value)}
                        />

                        <TextField
                            margin="dense"
                            label="Estimated Hours"
                            type="number"
                            fullWidth
                            variant="outlined"
                            value={newTask.estimated_hours || ''}
                            onChange={(e) => handleInputChange('estimated_hours', e.target.value ? parseFloat(e.target.value) : null)}
                        />

                        <TextField
                            margin="dense"
                            label="Related App"
                            fullWidth
                            variant="outlined"
                            value={newTask.related_app}
                            onChange={(e) => handleInputChange('related_app', e.target.value)}
                        />

                        <TextField
                            margin="dense"
                            label="Related File"
                            fullWidth
                            variant="outlined"
                            value={newTask.related_file}
                            onChange={(e) => handleInputChange('related_file', e.target.value)}
                        />

                        {newTask.task_type === 'api_endpoint' && (
                            <TextField
                                margin="dense"
                                label="API Endpoint"
                                fullWidth
                                variant="outlined"
                                value={newTask.api_endpoint}
                                onChange={(e) => handleInputChange('api_endpoint', e.target.value)}
                            />
                        )}

                        {newTask.task_type === 'ocr_script' && (
                            <FormControl fullWidth margin="dense">
                                <InputLabel id="ocr-engine-label">OCR Engine</InputLabel>
                                <Select
                                    labelId="ocr-engine-label"
                                    value={newTask.ocr_engine || ''}
                                    label="OCR Engine"
                                    onChange={(e) => handleInputChange('ocr_engine', e.target.value)}
                                >
                                    <MenuItem value=""><em>None</em></MenuItem>
                                    <MenuItem value="tesseract">Tesseract</MenuItem>
                                    <MenuItem value="google">Google Cloud Vision</MenuItem>
                                </Select>
                            </FormControl>
                        )}
					</Box>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setOpenAddDialog(false)} disabled={loading}>Cancel</Button>
					<Button onClick={handleAddTask} disabled={loading}>
						{loading ? <CircularProgress size={24} /> : 'Add'}
					</Button>
				</DialogActions>
			</Dialog>

            {/* Upload Receipt Dialog - No changes needed from previous version */}
            <Dialog open={openUploadDialog} onClose={() => setOpenUploadDialog(false)}>
				<DialogTitle>Upload Receipt</DialogTitle>
				<DialogContent>
					<RadioGroup
						row
						value={uploadOption}
						onChange={(e) => setUploadOption(e.target.value)}
					>
						<FormControlLabel value="direct_llm" control={<Radio />} label="Direct LLM" />
						<FormControlLabel value="ocr_llm_single" control={<Radio />} label="OCR + LLM (Single)" />
						<FormControlLabel value="ocr_llm_multiple" control={<Radio />} label="OCR + LLM (Multiple)" />
					</RadioGroup>

                    <input
                        type="file"
                        multiple={uploadOption === 'ocr_llm_multiple'}
                        onChange={handleFileChange}
                        style={{marginTop: '1rem'}}
                    />

				</DialogContent>
				<DialogActions>
					<Button onClick={() => setOpenUploadDialog(false)} disabled={loading}>Cancel</Button>
                    <Button onClick={handleFileUpload} disabled={loading}>
                        {loading? <CircularProgress size={24} />: "Upload"}
                    </Button>
				</DialogActions>
			</Dialog>



            <TableContainer 
                component={Paper} 
                sx={{ 
                    boxShadow: 3,
                    '& .MuiTableRow-root:hover': {
                        backgroundColor: '#f5f5f5',
                        transition: 'background-color 0.2s ease'
                    }
                }}
            >
                <Table sx={{ minWidth: 650 }} aria-label="collapsible table">
                    <TableHead>
                        <TableRow sx={{ 
                            backgroundColor: '#1976d2',
                        }}>
                            <TableCell sx={{ width: '48px' }} />
                            <TableCell sx={{ 
                                fontWeight: 'bold', 
                                fontSize: '1rem',
                                color: 'white',
                                width: '30%'
                            }}>Task Title</TableCell>
                            <TableCell sx={{ 
                                fontWeight: 'bold',
                                color: 'white',
                                width: '15%'
                            }}>Status</TableCell>
                            <TableCell sx={{ 
                                fontWeight: 'bold',
                                color: 'white',
                                width: '15%'
                            }}>Type</TableCell>
                            <TableCell sx={{ 
                                fontWeight: 'bold',
                                color: 'white',
                                width: '20%'
                            }}>Task Status</TableCell>
                            <TableCell sx={{ 
                                fontWeight: 'bold',
                                color: 'white',
                                width: '20%'
                            }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                           <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                                    <CircularProgress />
                                </TableCell>
                            </TableRow>
                        ) : filteredTasks.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                                    <Typography variant="subtitle1" color="text.secondary">
                                        No tasks found. Click "Add Task" to create one.
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredTasks.map((task) => (
                                <React.Fragment key={task.id}>
                                    <TableRow 
                                        sx={{ 
                                            '& > *': { borderBottom: 'unset' },
                                            backgroundColor: expanded[task.id] ? 'rgba(25, 118, 210, 0.04)' : 'inherit'
                                        }}
                                    >
                                        <TableCell>
                                            <IconButton
                                                aria-label="expand row"
                                                size="small"
                                                onClick={() => handleExpandClick(task.id)}
                                                sx={{
                                                    transition: 'transform 0.2s',
                                                    transform: expanded[task.id] ? 'rotate(180deg)' : 'rotate(0deg)'
                                                }}
                                            >
                                                <ExpandMoreIcon />
                                            </IconButton>
                                        </TableCell>
                                        <TableCell 
                                            component="th" 
                                            scope="row"
                                        >
                                            <Typography
                                                sx={{ 
                                                    fontSize: '1rem',
                                                    fontWeight: 500,
                                                    color: '#1976d2',
                                                    cursor: 'pointer',
                                                    '&:hover': {
                                                        textDecoration: 'underline'
                                                    }
                                                }}
                                                onClick={() => handleExpandClick(task.id)}
                                            >
                                                {task.title}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Chip
                                                    icon={getStatusIcon(task.status)}
                                                    label={task.status.replace('_', ' ')}
                                                    size="small"
                                                    sx={(theme) => ({
                                                        ...getStatusStyle(task.status),
                                                        textTransform: 'capitalize',
                                                        border: '1px solid',
                                                        fontWeight: 500
                                                    })}
                                                />
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={task.task_type.replace('_', ' ')}
                                                size="small"
                                                sx={{
                                                    textTransform: 'capitalize',
                                                    backgroundColor: '#f0f7ff',
                                                    color: '#0a1929',
                                                    border: '1px solid #bcd9f7'
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Tooltip title={task.assigned_to ? `Assigned to ${task.assigned_to}` : 'Unassigned'}>
                                                <Chip
                                                    avatar={<Avatar>{task.assigned_to ? task.assigned_to[0].toUpperCase() : 'U'}</Avatar>}
                                                    label={task.assigned_to || 'Unassigned'}
                                                    size="small"
                                                    sx={{
                                                        backgroundColor: task.assigned_to ? '#f0f7ff' : '#f5f5f5',
                                                        color: task.assigned_to ? '#0a1929' : '#757575',
                                                        border: `1px solid ${task.assigned_to ? '#bcd9f7' : '#e0e0e0'}`
                                                    }}
                                                />
                                            </Tooltip>
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', gap: 1 }}>
                                                <Select
                                                    value={task.status}
                                                    onChange={(e) => handleUpdateTask(task.id, {status: e.target.value})}
                                                    disabled={loading}
                                                    size="small"
                                                    sx={{ 
                                                        minWidth: 120,
                                                        '& .MuiSelect-select': {
                                                            py: 1
                                                        }
                                                    }}
                                                >
                                                    <MenuItem value="not_started">Not Started</MenuItem>
                                                    <MenuItem value="in_progress">In Progress</MenuItem>
                                                    <MenuItem value="blocked">Blocked</MenuItem>
                                                    <MenuItem value="testing">Testing</MenuItem>
                                                    <MenuItem value="completed">Completed</MenuItem>
                                                </Select>
                                                <Button
                                                    variant="outlined"
                                                    size="small"
                                                    onClick={() => handleEditClick(task)}
                                                    sx={{ minWidth: 'auto' }}
                                                >
                                                    Edit
                                                </Button>
                                                <Tooltip title="Delete Task">
                                                    <IconButton 
                                                        onClick={() => handleDeleteTask(task.id)} 
                                                        disabled={loading} 
                                                        aria-label="delete"
                                                        color="error"
                                                        size="small"
                                                        sx={{
                                                            border: '1px solid',
                                                            borderColor: 'error.light',
                                                            '&:hover': {
                                                                backgroundColor: 'error.light',
                                                                color: 'white'
                                                            }
                                                        }}
                                                    >
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                                            <Collapse in={expanded[task.id]} timeout="auto" unmountOnExit>
                                                <Box sx={{ 
                                                    margin: 2,
                                                    backgroundColor: '#fff',
                                                    padding: 3,
                                                    borderRadius: 1,
                                                    border: '1px solid rgba(0, 0, 0, 0.12)',
                                                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                                                }}>
                                                    <Typography variant="h6" gutterBottom component="div" color="primary" sx={{ mb: 2 }}>
                                                        Task Details
                                                    </Typography>
                                                    <Grid container spacing={2}>
                                                        <Grid item xs={12}>
                                                            <Typography variant="body1" sx={{ mb: 1 }}>
                                                                <strong>Description:</strong> {task.description}
                                                            </Typography>
                                                        </Grid>
                                                        {task.due_date && (
                                                            <Grid item xs={6}>
                                                                <Typography variant="body2" sx={{ 
                                                                    color: 'text.secondary',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: 1
                                                                }}>
                                                                    <strong>Due Date:</strong> 
                                                                    {new Date(task.due_date).toLocaleDateString()}
                                                                </Typography>
                                                            </Grid>
                                                        )}
                                                        {task.estimated_hours && (
                                                            <Grid item xs={6}>
                                                                <Typography variant="body2" sx={{ 
                                                                    color: 'text.secondary',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: 1
                                                                }}>
                                                                    <strong>Estimated Hours:</strong> 
                                                                    {task.estimated_hours}
                                                                </Typography>
                                                            </Grid>
                                                        )}
                                                        <Grid item xs={6}>
                                                            <Typography variant="body2" sx={{ 
                                                                color: 'text.secondary',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: 1
                                                            }}>
                                                                <strong>Assigned To:</strong> 
                                                                {task.assigned_to || 'Unassigned'}
                                                            </Typography>
                                                        </Grid>
                                                        {task.related_app && (
                                                            <Grid item xs={6}>
                                                                <Typography variant="body2" sx={{ 
                                                                    color: 'text.secondary',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: 1
                                                                }}>
                                                                    <strong>Related App:</strong> 
                                                                    {task.related_app}
                                                                </Typography>
                                                            </Grid>
                                                        )}
                                                        {task.related_file && (
                                                            <Grid item xs={6}>
                                                                <Typography variant="body2" sx={{ 
                                                                    color: 'text.secondary',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: 1
                                                                }}>
                                                                    <strong>Related File:</strong> 
                                                                    {task.related_file}
                                                                </Typography>
                                                            </Grid>
                                                        )}
                                                        {task.api_endpoint && (
                                                            <Grid item xs={6}>
                                                                <Typography variant="body2" sx={{ 
                                                                    color: 'text.secondary',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: 1
                                                                }}>
                                                                    <strong>API Endpoint:</strong> 
                                                                    {task.api_endpoint}
                                                                </Typography>
                                                            </Grid>
                                                        )}
                                                        {task.ocr_engine && (
                                                            <Grid item xs={6}>
                                                                <Typography variant="body2" sx={{ 
                                                                    color: 'text.secondary',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: 1
                                                                }}>
                                                                    <strong>OCR Engine:</strong> 
                                                                    {task.ocr_engine}
                                                                </Typography>
                                                            </Grid>
                                                        )}
                                                    </Grid>
                                                </Box>
                                            </Collapse>
                                        </TableCell>
                                    </TableRow>
                                </React.Fragment>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Add Edit Dialog */}
            <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} fullWidth maxWidth="md">
                <DialogTitle>Edit Task</DialogTitle>
                <DialogContent>
                    {editTask && (
                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                            <TextField
                                autoFocus
                                margin="dense"
                                label="Task Title"
                                fullWidth
                                variant="outlined"
                                value={editTask.title}
                                onChange={(e) => handleEditInputChange('title', e.target.value)}
                            />
                            <FormControl fullWidth margin="dense">
                                <InputLabel id="edit-task-type-label">Task Type</InputLabel>
                                <Select
                                    labelId="edit-task-type-label"
                                    value={editTask.task_type}
                                    label="Task Type"
                                    onChange={(e) => handleEditInputChange('task_type', e.target.value)}
                                >
                                    <MenuItem value="general">General Task</MenuItem>
                                    <MenuItem value="ocr_script">OCR Script</MenuItem>
                                    <MenuItem value="api_endpoint">API Endpoint</MenuItem>
                                    <MenuItem value="frontend_ui">Frontend UI</MenuItem>
                                    <MenuItem value="model_creation">Model Creation</MenuItem>
                                    <MenuItem value="authentication">Authentication</MenuItem>
                                    <MenuItem value="prompt_tuning">Prompt Tuning</MenuItem>
                                </Select>
                            </FormControl>

                            <TextField
                                margin="dense"
                                label="Task Description"
                                fullWidth
                                variant="outlined"
                                multiline
                                rows={4}
                                value={editTask.description}
                                onChange={(e) => handleEditInputChange('description', e.target.value)}
                            />
                            <TextField
                                margin="dense"
                                label="Assigned To"
                                fullWidth
                                variant="outlined"
                                value={editTask.assigned_to}
                                onChange={(e) => handleEditInputChange('assigned_to', e.target.value)}
                                placeholder="Enter assignee name"
                            />

                            <TextField
                                margin="dense"
                                label="Due Date"
                                type="date"
                                fullWidth
                                variant="outlined"
                                InputLabelProps={{ shrink: true }}
                                value={editTask.due_date || ''}
                                onChange={(e) => handleEditInputChange('due_date', e.target.value)}
                            />

                            <TextField
                                margin="dense"
                                label="Estimated Hours"
                                type="number"
                                fullWidth
                                variant="outlined"
                                value={editTask.estimated_hours || ''}
                                onChange={(e) => handleEditInputChange('estimated_hours', e.target.value ? parseFloat(e.target.value) : null)}
                            />

                            <TextField
                                margin="dense"
                                label="Related App"
                                fullWidth
                                variant="outlined"
                                value={editTask.related_app}
                                onChange={(e) => handleEditInputChange('related_app', e.target.value)}
                            />

                            <TextField
                                margin="dense"
                                label="Related File"
                                fullWidth
                                variant="outlined"
                                value={editTask.related_file}
                                onChange={(e) => handleEditInputChange('related_file', e.target.value)}
                            />

                            {editTask.task_type === 'api_endpoint' && (
                                <TextField
                                    margin="dense"
                                    label="API Endpoint"
                                    fullWidth
                                    variant="outlined"
                                    value={editTask.api_endpoint}
                                    onChange={(e) => handleEditInputChange('api_endpoint', e.target.value)}
                                />
                            )}

                            {editTask.task_type === 'ocr_script' && (
                                <FormControl fullWidth margin="dense">
                                    <InputLabel id="edit-ocr-engine-label">OCR Engine</InputLabel>
                                    <Select
                                        labelId="edit-ocr-engine-label"
                                        value={editTask.ocr_engine || ''}
                                        label="OCR Engine"
                                        onChange={(e) => handleEditInputChange('ocr_engine', e.target.value)}
                                    >
                                        <MenuItem value=""><em>None</em></MenuItem>
                                        <MenuItem value="tesseract">Tesseract</MenuItem>
                                        <MenuItem value="google">Google Cloud Vision</MenuItem>
                                    </Select>
                                </FormControl>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenEditDialog(false)} disabled={loading}>Cancel</Button>
                    <Button onClick={handleEditTask} disabled={loading}>
                        {loading ? <CircularProgress size={24} /> : 'Save Changes'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default TaskList;