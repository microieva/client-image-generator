import React from 'react';
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Pagination,
  ImageListItem,
  ImageList,
  ImageListItemBar,
  IconButton,
  Tooltip,
  Chip
} from '@mui/material';
import { Download } from '@mui/icons-material';
import { useImages } from '../hooks/useImages';
import { useDevice } from '../contexts/DeviceContext';

export const Images: React.FC = () => {
  const {
    images,
    loading,
    error,
    pagination,
    totalImages,
    handleDownload,
    changePage
  } = useImages();
  const { isMobile } = useDevice();
  const totalPages = Math.ceil(totalImages / pagination.limit);

  const handlePageChange = (_event: React.ChangeEvent<unknown>, page: number) => {
    changePage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight:'85vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container 
      maxWidth="xl"
      sx={{ 
          display:'flex',
          flexDirection:'column',
          gap:6,
          mb:4
        }}
      >
      <Box  sx={{mt:4, display:'flex', flexDirection:'row', alignItems:'center', gap:4}}>
        <Typography variant="h5" component="h4" gutterBottom sx={{mb:0}}>
          Image Collection 
        </Typography>
        <Chip label={totalImages} size="small" variant="outlined" sx={{minWidth:'2.1rem;'}}/>
      </Box>

      {images.length === 0 ? (
        <Box sx={{ textAlign: 'center', mt: 8 }}>
          <Typography variant="h6" color="text.secondary">
            No images generated yet
          </Typography>
        </Box>
      ) : (
        <>
          <ImageList cols={isMobile ? 1 : 2}>
            {images.map((image) => (
              <ImageListItem key={image.task_id} sx={{maxWidth:isMobile ? '100vw':'45vw', height:isMobile ? 'auto':'45vw'}}>
                <Chip 
                  label={image.model_used} 
                  size="small"
                  variant="filled" 
                  sx={{position:'absolute', top:8, left:8, fontSize:'6px', zIndex:1, visibility: image.model_used ? 'visible' : 'hidden'}}
                 />
                <img
                  srcSet={image.image_url}
                  src={image.image_url}
                  alt={`Generated image with prompt: ${image.prompt}`}
                  loading="lazy"
                  style={{borderRadius:5, maxHeight:'max-content'}} 
                />
                {image.image_url && 
                <ImageListItemBar
                  sx={{
                    '& .MuiImageListItemBar-subtitle': {
                      whiteSpace: 'wrap'
                    }
                  }}
                  title="Prompt text:"
                  subtitle={
                    <span style={{
                      color: 'darkgray'
                    }}>
                      {image.prompt}
                    </span>
                  }
                  position="below"
                  actionIcon={
                    <Tooltip title="Download image" arrow>
                      <IconButton
                        sx={{ color: 'inherit', mt:1 }}
                        aria-label={`download ${image.prompt}`}
                        onClick={() => handleDownload(image.image_url)}
                      >
                        <Download />
                      </IconButton>
                    </Tooltip>
                  }
                  actionPosition="right"
                />}
              </ImageListItem>
            ))}
          </ImageList>
          <Box sx={{ display: isMobile ? 'none': 'flex', justifyContent: 'center' }}>
            <Pagination
              count={totalPages} 
              page={pagination.page}
              onChange={handlePageChange}
              size="large"
              showFirstButton
              showLastButton
            />
          </Box>
        </>
      )}
    </Container>
  );
};
