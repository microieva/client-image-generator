import { Container, Box, Typography, Button, Divider, CircularProgress } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAnimation } from "../contexts/AnimationContext";
import { useDevice } from "../contexts/DeviceContext";
import { useCachedApi } from "../hooks/useCachedApi";

export const Home: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isTasks, setIsTasks] = useState<boolean>(false);
  const [isImages, setIsImages] = useState<boolean>(false);
  const [animationClass, setAnimationClass] = useState<string>('');
  const navigate = useNavigate();
  const { setAnimationType } = useAnimation();
  const { isDesktop } = useDevice();
  const { get, stats } = useCachedApi({
    ttl: 5 * 60 * 1000, // 5 minutes
    invalidateOnMutate: true
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        const [tasksResult, imagesResult] = await Promise.all([
          get<any>('/tasks'),
          get<any>('/images')
        ]);

        const taskData = tasksResult.data;
        const imageData = imagesResult.data;

        const hasTasks = taskData.total_tasks > 0;
        const hasImages = imageData.length > 0;
        
        setAnimationClass("animate__animated animate__tada");
        setIsTasks(hasTasks);
        setIsImages(hasImages);

        const cacheStats = stats();
        console.log('Cache stats:', {
          tasksFromCache: tasksResult.fromCache,
          imagesFromCache: imagesResult.fromCache,
          hitRate: cacheStats.hitRate,
          size: cacheStats.size
        });

      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [get, stats]);


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
          sx={{display: !isLoading && !isTasks ? 'none' : 'block', margin: isLoading ? 'auto' : 0}}
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
            {isLoading ? <CircularProgress size={20} /> : 'Go to Tasks'}
        </Button>
        <Button
          sx={{display: !isLoading && !isImages ? 'none' : 'block', margin: isLoading ? 'auto' : 0}}
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
            {isLoading ? <CircularProgress size={20} /> : 'Go to Images'}
        </Button>
      </Box>
    </Container>
  );
};
