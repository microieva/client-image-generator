import { Container, Box, Typography, Button, Divider, CircularProgress } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAnimation } from "../contexts/AnimationContext";
import { useDevice } from "../contexts/DeviceContext";
import { apiClient } from "../config/api";

export const Home: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isTasks, setIsTasks] = useState<boolean>(false);
  const [isImages, setIsImages] = useState<boolean>(false);
  const [animationClass, setAnimationClass] = useState<string>('');
  const navigate = useNavigate();
  const { setAnimationType } = useAnimation();
  const { isDesktop } = useDevice();

useEffect(() => {
  const fetchTotals = async () => {
    try {
      const [tasksResponse, imagesResponse] = await Promise.all([
        apiClient.get(`/tasks`),
        apiClient.get(`/images`)
      ]);
      const taskData = tasksResponse.data;
      const imageData = imagesResponse.data;

      const hasTasks = taskData.total_tasks > 0;
      const hasImages = imageData.length > 0;
      
      setAnimationClass("animate__animated animate__tada");
      setIsTasks(hasTasks);
      setIsImages(hasImages);
      
    } catch (err) {
      console.error('Error fetching data of totals:', err);
    } finally {
      setIsLoading(false);
    }
  };
  fetchTotals();
}, []);

  const handleNavigateToGenerate = () => {
    if (isDesktop) setAnimationType('slideInRight');
    else {
      setAnimationType('slideInUp');
    }
    navigate('generate');
  };
  const handleNavigateToTasks = () => {
    if (isDesktop) setAnimationType('slideInRight');
    else setAnimationType('slideInUp');
    navigate('/tasks');
  };
   const handleNavigateToImages = () => {
    if (isDesktop) setAnimationType('slideInRight');
    else setAnimationType('slideInUp');
    navigate('/images');
  };

  if (isLoading) {
    return (
        <Container maxWidth="lg" sx={{ minHeight:'85vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress />
        </Container>
    ); 
  }

  return (
    <Container 
      maxWidth="lg" 
      data-testid="welcome-container"
      role="main" 
      aria-label="Welcome section"
      aria-labelledby="welcome-title" 
      sx={{
        display:'flex',
        flexDirection: isDesktop ? 'row' : 'column',
        justifyContent: isDesktop ? 'inherit' : 'space-evenly',
        height: isDesktop ? 'auto' : '88vh'
      }}
    >
      <Box 
        sx={{ 
          textAlign: 'start',
          minHeight: 'inherit',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'start',
          alignItems: 'start',
          gap: 4,
          flexWrap: 'wrap'
        }} 
        data-testid="welcome-box"
        aria-describedby="welcome-description" 
      >
        <Typography 
          variant="h3" 
          component="h1" 
          gutterBottom 
          data-testid="welcome-title"
          id="welcome-title" 
        >
          Welcome!
        </Typography>
        
        <Typography 
          variant="body1" 
          //sx={{ mb: 4 }} 
          data-testid="welcome-description"
          id="welcome-description" 
          aria-live="polite" 
        >
          This is a tiny image generator built with React, FastAPI server and Hugging Face models. You can generate images based on text prompts, check the status of your running tasks and view the images you generated today. Feel free to explore and create something amazing!
        </Typography>
      </Box>
      <Divider 
        aria-hidden="true" 
        orientation={isDesktop ? 'vertical':'horizontal'}
        variant="middle" 
        flexItem
        sx={{
          mx: isDesktop ? 10 : 0, 
          my: isDesktop ? 0 : '1vh',
        }}
      />
      <Box
         sx={{ 
          textAlign: 'start',
          minHeight: 'inherit',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'start',
          alignItems: isDesktop ?  'start':'center',
          gap: 4,
          flexWrap: 'wrap'
        }}>
         <Button
          size="small"
          onClick={handleNavigateToGenerate}
          variant="contained"
          data-testid="go-to-generate-button"
          aria-label="Go to image generation page" 
          aria-describedby="welcome-description" 
          role="button" 
          tabIndex={0} 
          onKeyUp={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleNavigateToGenerate();
            }
          }}
        >
          Go to Generate
        </Button>
        <Button
          sx={{display: isTasks ? 'block' : 'none'}}
          className={isTasks ? animationClass : ''}
          size="small"
          variant="contained"
          onClick={handleNavigateToTasks}
          data-testid="go-to-tasks-button"
          aria-label="Go to running tasks page" 
          aria-describedby="welcome-description" 
          role="button" 
          tabIndex={0} 
          onKeyUp={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleNavigateToTasks();
            }
            }}
          >
            Go to Tasks
        </Button>
        <Button
          sx={{display: isImages ? 'block' : 'none'}}
          className={isImages ? animationClass : ''}
          size="small"
          variant="contained"
          onClick={handleNavigateToImages}
          data-testid="go-to-images-button"
          aria-label="Go to today's images page" 
          aria-describedby="welcome-description" 
          role="button" 
          tabIndex={0} 
          onKeyUp={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleNavigateToImages();
            }
            }}
          >
            Go to Images
        </Button>
      </Box>
    </Container>
  );
};
