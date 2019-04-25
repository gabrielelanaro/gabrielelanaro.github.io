---
title: VisualNeurons.com, running Neural Style Transfer on AWS
layout: page
tags: machine learning
categories: blog
comments: true
include_js: ["http://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS-MML_HTMLorMML"]
---
![](https://paper-attachments.dropbox.com/s_957D88477600ADB33D75225DE42328A312E2048125F2D624216C089FD114B50C_1556020967859_FeaturedImage.png)


**A quick disclaimer**: [visualneurons.com](http://visualneurons.com/), together with this post, is a 2-man work, adding up the efforts of [Francesco Pochetti](https://francescopochetti.com/) and [Gabriele Lanaro](https://gabrielelanaro.github.io/). The code is available [here on Github](https://github.com/gabrielelanaro/ml-prototypes/tree/master/prototypes/styletransfer).

## Table of Contents
1. Our Style Transfer web application 
2. Style Transfer in a nutshell
3. Architecting on AWS
    1. The bird-eye view
    2. The core idea: websockets
    3. The frontend: pure javascript
    4. The backend: Lambda and EC2


# Our Style Transfer web application

First things first. Before diving into the implementation, let’s see how the web application looks like when in action. You can check it out yourself at [visualneurons.com](http://visualneurons.com/) and below you can find a quick demo.
The user chooses an artwork from the drop-down menu, uploads a personal picture, and then lets the magic happen. The Deep Learning model, under the curtains, blends the style of the piece of art with the content of the photo, creating a brand new image.

<iframe src="https://drive.google.com/file/d/1DjR5sj9apwxqEQABJLHW2EyUCro2n-Vx/preview" width="640" height="480"></iframe>

# Style Transfer in a nutshell

Neural Style Transfer was first introduced by [Gatys et al](https://www.robots.ox.ac.uk/~vgg/rg/papers/1508.06576v2.pdf) in a famous 2015 paper. Researchers addressed the following question: given a picture, how would it look like, had it been painted by Van Gogh?
The Dutch master is just an example, of course. The core idea was obviously not constrained by specific artists, and consisted in picking two images, a style one and a content one, and teaching a neural network to paint the content of the second with the style of the first. The trick behind the technique is nothing else than choosing the right loss function. As usual. The MSE loss for the content side, the [Gram loss](https://francescopochetti.com/style-transfer-with-fast-ai-and-pytorch/) for the style side. Sum it up and minimize with respect to the pixel values of the new image. Strictly speaking, there is no model, really. No parameters to optimize for future inference. Just get a pre-trained CNN (VGG19, in our case) and use it as a feature extractor. The loss is calculated directly on top of those features. Given those, the optimizer’s job is to iterate over style, content and new image, tuning the pixels of the blended picture to minimize the loss.

You get the point.

As the goal of this post is not to cover in detail the science behind Neural Style Transfer, we’ll cut it short here. If we managed to tickle your curiosity, you can find a more detailed explanation in [this](https://francescopochetti.com/style-transfer-with-fast-ai-and-pytorch/) blog post. 


# Architecting on AWS

Now that you know what we achieved and what is the science behind it, let’s focus on how we got there. This section is a deep dive into the technical implementation of our web application, what we used, why we did what we did and how we debugged the pipeline as it grew in complexity. 


## The bird-eye view

Here a diagram of the architecture we ended up implementing. 

![](https://paper-attachments.dropbox.com/s_957D88477600ADB33D75225DE42328A312E2048125F2D624216C089FD114B50C_1555767979474_AWS_architecture.png)


Everything starts with users hitting [visualneurons.com](http://visualneurons.com/). Amazon [Route 53](https://aws.amazon.com/route53/) is in charge of resolving the domain name and redirecting traffic to the S3 bucket we used to host our static website.

1. After landing on the application, users select a style image among the proposed artworks, they upload a personal content picture and click `Run Style Transfer`. This action triggers a POST request to [API Gateway](https://aws.amazon.com/api-gateway/).
2. API Gateway triggers AWS [Lambda](https://aws.amazon.com/lambda/).
3. Lambda spins up a GPU-powered EC2 instance (p2.xlarge), sets up the Tensorflow environment and starts a server-side python websocket. [Here](https://github.com/gabrielelanaro/ml-prototypes/blob/master/prototypes/styletransfer/lambda.py) the full code of the function.
4. As soon as the instance’s status turns into `Running`, Lambda returns the EC2’s public DNS to the frontend, which needs it to fire a javascript websocket and connect it to the backend.
5. When connection betwen the two sockets is established, the frontend ships content and style pictures to the backend, and the backend replies back streaming the model’s iterations, which the user watches rapidly updating live on the web page.

The `p2.xlarge` EC2 instance is set to auto-terminate after either 7 minutes from its spin-up, or model-run completion. Whatever happens first.
Here a deep dive around the communication between client and server websockets. In the upcoming sections the logic will be explained in greater detail.

![](https://paper-attachments.dropbox.com/s_957D88477600ADB33D75225DE42328A312E2048125F2D624216C089FD114B50C_1556020873965_Detailed_arch.png)

## Core Idea: Streaming Images Using Websockets

Style transfer (at least in its original form) is an iterative process as it requires minimizing the combined content loss and style loss. The procedure usually takes several iterations to obtain visible results.

To have a more interesting and pleasing effect, we need to stream images in real time to the browser and to do that, it’s convenient to open a bidirectional channel of communication between the browser and the server

Enter WebSockets. Through a websocket we can open a channel, talk to the server, and let the server talk to the browser directly. For WebSockets to work, we need to implement a Client in the browser and a Server in a powerful machine capable of running style transfer (let’s assume that the machine is already running, we’ll describe how it is activated more in detail further below). The client and server can send each other messages (typically as JSON strings, but you are free to use the protocol that you prefer).

To its core, a very bare-bone client would be something like the one illustrated in the following Javascript snippet. We specify a new websocket connection, and we instruct the client to send a message as soon as the connection is established (the `open` callback), and we provide a callback to execute when a message is received.

    ws = new WebSocket(url);
    ws.open = function (event) { ws.send({"my message": "whatever"}); };
    ws.onmessage = function (event) { /* do something with the message received */};
    ws.close = function (event) { /* close */ };

On the other side of the wire (in Python) we have the server that is implemented in an equivalent way, but in Python and using the networking framework [tornado](https://www.tornadoweb.org/).

To implement our style transfer application, we designed the following workflow:

- the server loads the model as soon as the connection is established
- once the model is loaded, the client provides the content and style images for style transfer encoded in base64.
- at this point the server will inform us each time it starts and ends the iteration and provides us with the intermediate results (as an image in base64).

The workflow can be better explained using the timeline drawn in the following diagram, that illustrates how the information flows back and forth between the client and the server.


![](https://paper-attachments.dropbox.com/s_9AD7FBCD8981FD28AC66C1E445AC094D0F93D697791C15DEE6707F1EBD15AB4A_1555944389516_drawing.svg.png)


An in-depth description of the implementation is beyond the scope of this post (the full code is available in the [github repo](https://github.com/gabrielelanaro/ml-prototypes/blob/master/prototypes/styletransfer/server.py)). However it’s worth briefly mentioning the design of the classes involved

The implementation was done by implementing three classes:

- A StyleTransferSocket server ([server.py](https://github.com/gabrielelanaro/ml-prototypes/blob/master/prototypes/styletransfer/server.py)): This class is mostly a boilerplate necessary to specify a websocket with tornado
- A StyleTransfer class ([model.py](https://github.com/gabrielelanaro/ml-prototypes/blob/master/prototypes/styletransfer/model.py)): This class represents a model and implements the styletransfer as a generator. This is because a generator is the natural way to represent streaming data in Python
- A StyleTransferController class ([controller.py](https://github.com/gabrielelanaro/ml-prototypes/blob/master/prototypes/styletransfer/controller.py)) which takes care of integrating the StyleTransferSocket and the StyleTransfer model class by adapting inputs and sending outputs to the connected client.

Now that we have an idea about the components and how the interact, what is left to do is deploying the client and server and make them talk!

## Frontend: Serving static content using S3

To serve the client’s code all is needed is a simple frontend server capable of serving static content. S3 makes this kind of operation extremely easy. We just create a bucket, drop our [index.html](https://github.com/gabrielelanaro/ml-prototypes/blob/master/prototypes/styletransfer/website/index.html), [style](https://github.com/gabrielelanaro/ml-prototypes/blob/master/prototypes/styletransfer/website/styles.css)[s](https://github.com/gabrielelanaro/ml-prototypes/blob/master/prototypes/styletransfer/website/styles.css)[.cs](https://github.com/gabrielelanaro/ml-prototypes/blob/master/prototypes/styletransfer/website/styles.css)[s](https://github.com/gabrielelanaro/ml-prototypes/blob/master/prototypes/styletransfer/website/styles.css) and [script](https://github.com/gabrielelanaro/ml-prototypes/blob/master/prototypes/styletransfer/website/scripts.js)[s](https://github.com/gabrielelanaro/ml-prototypes/blob/master/prototypes/styletransfer/website/scripts.js)[.js](https://github.com/gabrielelanaro/ml-prototypes/blob/master/prototypes/styletransfer/website/scripts.js) into it and we are ready to go.

When it comes to redirecting traffic to the bucket, it is as simple as buying a domain on Amazon Route 53 and pointing it to S3. An in-depth tutorial on how to achieve this is available [here](https://francescopochetti.com/is-this-movie-a-thrillerinvoking-a-sagemaker-deep-learning-model-in-an-end-to-end-serverless-web-application/#Creating_an_S3_Bucket_to_host_a_website) and [here](https://francescopochetti.com/is-this-movie-a-thrillerinvoking-a-sagemaker-deep-learning-model-in-an-end-to-end-serverless-web-application/#Buy_a_domain_on_Route_53_and_redirect_traffic_to_S3). 

Something worth mentioning when setting up the website, and the client websocket which comes with it, is a quick note on security. For obvious reasons, whenever building a web application, it is highly recommended to buy a SSL certificate and secure the domain with https. Running things through this protocol is good, as any communication between a browser and a server is encrypted. This also means, though, that we have to do some extra work to decrypt messages whenever either the browser or the server needs to do something useful with those messages. This is the case of our application, which is based on JSON-formatted strings sent back and forth across the web.As we were running the dev version of the app directly via S3 (e.g. via https), what we noticed was that the python server websocket would not understand the initial connection message from the javascript client websocket. Given the additional complexity of dealing with this issue, we decided to compromise on security and stick to the http protocol instead. This is why our application runs on http://visualneurons.com/ and **not on** https://visualneurons.com/. This also means the URL the javascript websockets needs to connect to is of the form `"ws://" + EC2_public_dns + ":8000/styletransfer"` and **not** `"wss://" + EC2_public_dns + ":8000/styletransfer"`. Small details making a whole lot of a difference.

## Backend: Writing a job runner using lambda and EC2

Since we didn’t want to keep an expensive GPU instance running 24/7 for our demo, we designed a way to spin up EC2 systems on demand using API Gateway and Lambda. The code that spins up the instance and return its full address, relies on the amazon [boto](https://aws.amazon.com/sdk-for-python/) library for Python. For reference, [](https://github.com/gabrielelanaro/ml-prototypes/blob/master/prototypes/styletransfer/lambda.py)the full code of the function can be found [at this link](https://github.com/gabrielelanaro/ml-prototypes/blob/master/prototypes/styletransfer/lambda.py). In this section we illustrate the step necessary to configure and run the backend.

### Preparing the base image (EC2)
To prepare our base image, we started from one of the amazon [deep learning AMIs](https://aws.amazon.com/machine-learning/amis/) and customized it to our needs (we only needed to run styletransfer once so that the model files for VGG are already cached on the server). We then created our own AMI using EC2 so that the instance is already set up at start time. 

### Configure the security settings (EC2)
The port we listen on the websocket server (8000) has to be open. This is easily achieved using [Security Groups](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-network-security.html).

### Write our Lambda (Lambda)
Lambda will be responsible to create an EC2 instance using the `run_instances` method, and will need to provide the `AMI_ID` (the id of our newly created AMI), as well as our security group. It’s also necessary to provide an initialization script (`UserData` argument), which we will discuss more in the following section. Below is an example of the `run_instances` call.


    instance = ec2_object.run_instances(
                ImageId=AMI_ID,
                InstanceType=INSTANCE_TYPE,
                MinCount=1,
                MaxCount=1,
                KeyName=KEY_NAME,
                SecurityGroups=[
                    SECURITY_GROUP,
                ],
                # make shutdown in script terminate ec2
                InstanceInitiatedShutdownBehavior='terminate', 
                UserData=script # file to run on instance init.
    )

Once the instance is spun up, we need to execute an initialization script (code below) that:

- updates the git repo with latest code
- sets the instance to be shut down in 7 minutes
- loads the conda environment for our code to run
- waits for incoming websocket connections on port 8000
- once the websocket is done with its job, shuts down the instance

Note that the init script is run as root, while we wanted to run our websocket server as a normal user (this was also necessary to properly load our settings). To do that, we used `sudo`  to invoke a `bash`  process and passed the initalization script for the user between two `EOF`  delimiter. Troubleshooting this issue was quite a pain, and we used the init script logfiles that are located in  `/var/log/cloud-init-output.log` 


    #!/bin/bash
    cd /home/ubuntu
    cd ml-prototypes
    git pull
    shutdown -h +7
    # Necessary to being able to load all the necessary environment
    sudo -i -u ubuntu bash <<-EOF
    source ~/.bashrc
    source activate tensorflow_p36
    export PYTHONPATH=/home/ubuntu/ml-prototypes
    python -m prototypes.styletransfer.app --address=0.0.0.0 --port=8000
    EOF
    shutdown -h now

A better practice would have been to use something like [supervisor](http://supervisord.org/) to manage, starting, stopping and logging of the websocket server. But we opted for simplicity.

### Enable CORS (API Gateway)
CORS stands from [Cross Origin Resource Sharing](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS). This is a mechanism getting triggered as soon as two resources sitting on different domains try sending data to each other. The two resources are the frontend, i.e. the website sitting on `http://visualneurons.com`, and the backend API Gateway, sitting on `https://myapi.execute-api.eu-west-1.amazonaws.com`. When the API returns the output of Lambda to the frontend, the browser checks whether this communication is allowed by looking at the headers of the resource being sent. Specifically, the header in question is `**'Access-Control-Allow-Origin': '*'**`. If this is missing, the browser blocks the incoming JSON. When working within the AWS ecosystem and dealing with web development, make sure you check the following two boxes to avoid suffering from some nasty headaches:

1. Enable CORS within the Amazon API Gateway console. Don’t forget to deploy your API afterwards. 
2. Wrap Lambda’s output around the headers you specifically need. This is what the function `format_response` is for, [here](https://github.com/gabrielelanaro/ml-prototypes/blob/master/prototypes/styletransfer/lambda.py).

## Issues and potential improvements

While we were quite happy with the overall results, we did face some issues while building the application and we have idea for further improvements.

****We experienced starting times of 3-5 minutes for the EC2 instances, which translate having to wait a long time before seeing any image on the screen. Having an instance running 24/7 would easily solve this issue ($$$). Another solution would be to implement a proper job runner that would automatically reuse existing instances instead of spinning up a new one every time.

Also, as VGG-19 is very memory intensive, we could also have tried using a smaller model or a more efficient style transfer implementation.

Overall we decided to live with these issues for the purpose of this demo and showcase a cost-effective productionalization of a machine learning application.

